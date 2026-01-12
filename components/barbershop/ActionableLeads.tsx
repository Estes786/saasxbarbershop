"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency, getWhatsAppLink, getDaysSince } from "@/lib/utils";
import { AlertTriangle, Gift, Star, MessageCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useRefresh } from "@/lib/context/RefreshContext";

interface Lead {
  id: string;
  customer_phone: string;
  customer_name: string;
  lead_segment: string;
  priority: string;
  recommended_action: string;
  whatsapp_message_template: string | null;
  days_since_last_visit: number | null;
  average_atv: number | null;
  total_visits: number | null;
  is_contacted: boolean;
}

export default function ActionableLeads() {
  const { refreshTrigger } = useRefresh();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>("all");

  useEffect(() => {
    fetchLeads();
  }, [refreshTrigger]); // Auto-refresh when trigger changes

  async function fetchLeads() {
    try {
      setLoading(true);

      // Fetch leads from database
      let query = supabase
        .from("barbershop_actionable_leads")
        .select("*")
        .eq("is_contacted", false)
        .order("priority", { ascending: true })
        .order("generated_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching leads:", error);
        // If table is empty or doesn't exist, calculate manually
        await calculateLeadsManually();
        return;
      }

      if (data) {
        setLeads(data);
      } else {
        // Fallback: calculate leads manually
        await calculateLeadsManually();
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching leads:", err);
      await calculateLeadsManually();
    }
  }

  async function calculateLeadsManually() {
    try {
      // Get all customers with their latest visit
      const { data: customers, error } = await supabase
        .from("barbershop_customers")
        .select("*");

      if (error) throw error;

      if (!customers || customers.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const calculatedLeads: Lead[] = [];

      // High-value churn risk (>45 days + avg ATV >45K)
      customers.forEach((customer: any) => {
        if (!customer.last_visit_date) return;

        const daysSince = getDaysSince(customer.last_visit_date);

        // High-value churn risk
        if (daysSince > 45 && customer.average_atv > 45000) {
          calculatedLeads.push({
            id: `churn-${customer.customer_phone}`,
            customer_phone: customer.customer_phone,
            customer_name: customer.customer_name,
            lead_segment: "high_value_churn",
            priority: "HIGH",
            recommended_action: "Segera hubungi untuk re-engagement",
            whatsapp_message_template: `Halo ${customer.customer_name}! 👋 Sudah lama tidak berkunjung ke barbershop kami. Kami punya promo spesial untuk Anda! Kapan bisa mampir lagi?`,
            days_since_last_visit: daysSince,
            average_atv: customer.average_atv,
            total_visits: customer.total_visits,
            is_contacted: false,
          });
        }

        // Coupon eligible (visit count divisible by 4)
        if (customer.coupon_eligible) {
          calculatedLeads.push({
            id: `coupon-${customer.customer_phone}`,
            customer_phone: customer.customer_phone,
            customer_name: customer.customer_name,
            lead_segment: "coupon_eligible",
            priority: "MEDIUM",
            recommended_action: "Ingatkan tentang kupon gratis 4+1",
            whatsapp_message_template: `Selamat ${customer.customer_name}! 🎉 Anda sudah mencapai ${customer.total_visits} kunjungan. Kunjungan berikutnya GRATIS dengan kupon 4+1! Yuk booking sekarang!`,
            days_since_last_visit: daysSince,
            average_atv: customer.average_atv,
            total_visits: customer.total_visits,
            is_contacted: false,
          });
        }

        // Review target (>2 visits, no review yet)
        if (
          customer.total_visits >= 2 &&
          !customer.google_review_given
        ) {
          calculatedLeads.push({
            id: `review-${customer.customer_phone}`,
            customer_phone: customer.customer_phone,
            customer_name: customer.customer_name,
            lead_segment: "review_target",
            priority: "LOW",
            recommended_action: "Request Google Review",
            whatsapp_message_template: `Halo ${customer.customer_name}! Terima kasih sudah setia dengan kami 🙏 Boleh minta tolong review di Google? Sangat membantu bisnis kami! Link: [GOOGLE_REVIEW_LINK]`,
            days_since_last_visit: daysSince,
            average_atv: customer.average_atv,
            total_visits: customer.total_visits,
            is_contacted: false,
          });
        }
      });

      setLeads(calculatedLeads);
      setLoading(false);
    } catch (err) {
      console.error("Error calculating leads manually:", err);
      setLeads([]);
      setLoading(false);
    }
  }

  const filteredLeads =
    selectedSegment === "all"
      ? leads
      : leads.filter((lead) => lead.lead_segment === selectedSegment);

  const segmentCounts = {
    all: leads.length,
    high_value_churn: leads.filter((l) => l.lead_segment === "high_value_churn").length,
    coupon_eligible: leads.filter((l) => l.lead_segment === "coupon_eligible").length,
    review_target: leads.filter((l) => l.lead_segment === "review_target").length,
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <MessageCircle className="mr-2" size={24} />
              💬 Actionable Leads Dashboard
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Customer segments yang perlu action segera
            </p>
          </div>
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Segment Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSegment("all")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedSegment === "all"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Semua ({segmentCounts.all})
          </button>
          <button
            onClick={() => setSelectedSegment("high_value_churn")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedSegment === "high_value_churn"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            <AlertTriangle className="inline mr-1" size={16} />
            Churn Risk ({segmentCounts.high_value_churn})
          </button>
          <button
            onClick={() => setSelectedSegment("coupon_eligible")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedSegment === "coupon_eligible"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            <Gift className="inline mr-1" size={16} />
            Coupon ({segmentCounts.coupon_eligible})
          </button>
          <button
            onClick={() => setSelectedSegment("review_target")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedSegment === "review_target"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            <Star className="inline mr-1" size={16} />
            Review ({segmentCounts.review_target})
          </button>
        </div>
      </div>

      {/* Leads List */}
      <div className="p-6">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="mx-auto mb-4" size={48} />
            <p className="text-lg font-medium">Tidak ada leads untuk segment ini</p>
            <p className="text-sm mt-2">
              Semua customer sudah dikontak atau belum ada yang masuk kriteria
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const segmentConfig = {
    high_value_churn: {
      color: "red",
      icon: <AlertTriangle size={20} />,
      label: "🔴 High-Value Churn Risk",
    },
    coupon_eligible: {
      color: "green",
      icon: <Gift size={20} />,
      label: "🟢 Coupon 4+1 Eligible",
    },
    review_target: {
      color: "blue",
      icon: <Star size={20} />,
      label: "🔵 Review Target",
    },
    ready_to_visit: {
      color: "yellow",
      icon: <MessageCircle size={20} />,
      label: "🟡 Ready to Visit",
    },
    new_customer_welcome: {
      color: "purple",
      icon: <MessageCircle size={20} />,
      label: "🟣 New Customer",
    },
  };

  const config =
    segmentConfig[lead.lead_segment as keyof typeof segmentConfig] ||
    segmentConfig.new_customer_welcome;

  const whatsappLink = lead.whatsapp_message_template
    ? getWhatsAppLink(lead.customer_phone, lead.whatsapp_message_template)
    : null;

  return (
    <div className={`border-l-4 border-${config.color}-500 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Segment Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-${config.color}-600`}>{config.icon}</span>
            <span className={`text-sm font-semibold text-${config.color}-700`}>
              {config.label}
            </span>
            <span className={`px-2 py-1 text-xs font-bold rounded ${
              lead.priority === "HIGH"
                ? "bg-red-100 text-red-700"
                : lead.priority === "MEDIUM"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {lead.priority}
            </span>
          </div>

          {/* Customer Info */}
          <h3 className="font-bold text-lg text-gray-900 mb-1">
            {lead.customer_name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{lead.customer_phone}</p>

          {/* Metrics */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-3">
            {lead.days_since_last_visit !== null && (
              <span>📅 {lead.days_since_last_visit} hari yang lalu</span>
            )}
            {lead.average_atv !== null && (
              <span>💰 Avg ATV: {formatCurrency(lead.average_atv)}</span>
            )}
            {lead.total_visits !== null && (
              <span>🔄 {lead.total_visits} kunjungan</span>
            )}
          </div>

          {/* Recommended Action */}
          <p className="text-sm font-medium text-gray-800 mb-3">
            ✨ <strong>Action:</strong> {lead.recommended_action}
          </p>

          {/* WhatsApp Message Template */}
          {lead.whatsapp_message_template && (
            <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-700 mb-3">
              <strong className="text-gray-900">Template Pesan:</strong>
              <p className="mt-1 italic">{lead.whatsapp_message_template}</p>
            </div>
          )}
        </div>

        {/* WhatsApp Button */}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 flex-shrink-0 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <MessageCircle size={18} />
            Kirim WA
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
