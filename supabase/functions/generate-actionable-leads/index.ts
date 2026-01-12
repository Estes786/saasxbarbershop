// ========================================
// EDGE FUNCTION: generate-actionable-leads
// ========================================
// Purpose: Generate actionable lead segments for marketing
// Trigger: Scheduled (daily) or after customer profile update
// ========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Generating actionable leads...");

    // Clear expired leads first
    await supabase
      .from("barbershop_actionable_leads")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // Get all customers
    const { data: customers, error: customersError } = await supabase
      .from("barbershop_customers")
      .select("*");

    if (customersError) throw customersError;

    console.log(`Analyzing ${customers?.length} customers...`);

    const leads: any[] = [];

    // Process each customer
    for (const customer of customers || []) {
      const daysSinceLastVisit = customer.last_visit_date
        ? Math.floor(
            (new Date().getTime() - new Date(customer.last_visit_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;

      // 1. High-Value Churn Risk (PRIORITY: HIGH)
      if (
        daysSinceLastVisit > 45 &&
        customer.average_atv > 45000 &&
        customer.churn_risk_score > 0.5
      ) {
        leads.push({
          customer_phone: customer.customer_phone,
          customer_name: customer.customer_name,
          lead_segment: "high_value_churn",
          priority: "HIGH",
          recommended_action: "Kirim WA: Promo eksklusif comeback untuk pelanggan VIP",
          whatsapp_message_template: generateWhatsAppMessage(
            customer,
            "high_value_churn"
          ),
          days_since_last_visit: daysSinceLastVisit,
          average_atv: customer.average_atv,
          total_visits: customer.total_visits,
          lifetime_value: customer.lifetime_value,
          expires_at: getExpirationDate(7), // 7 days
        });
      }

      // 2. Coupon Eligible (PRIORITY: MEDIUM)
      if (customer.coupon_eligible && customer.total_visits >= 4) {
        leads.push({
          customer_phone: customer.customer_phone,
          customer_name: customer.customer_name,
          lead_segment: "coupon_eligible",
          priority: "MEDIUM",
          recommended_action: "Kirim WA: Notifikasi kupon 4+1 gratis siap digunakan",
          whatsapp_message_template: generateWhatsAppMessage(customer, "coupon_eligible"),
          days_since_last_visit: daysSinceLastVisit,
          average_atv: customer.average_atv,
          total_visits: customer.total_visits,
          lifetime_value: customer.lifetime_value,
          expires_at: getExpirationDate(14), // 14 days
        });
      }

      // 3. Ready to Visit (PRIORITY: MEDIUM)
      if (
        customer.average_recency_days &&
        daysSinceLastVisit >= customer.average_recency_days * 0.8 &&
        daysSinceLastVisit <= customer.average_recency_days * 1.2
      ) {
        leads.push({
          customer_phone: customer.customer_phone,
          customer_name: customer.customer_name,
          lead_segment: "ready_to_visit",
          priority: "MEDIUM",
          recommended_action: "Kirim WA: Reminder gentle untuk booking",
          whatsapp_message_template: generateWhatsAppMessage(customer, "ready_to_visit"),
          days_since_last_visit: daysSinceLastVisit,
          average_atv: customer.average_atv,
          total_visits: customer.total_visits,
          lifetime_value: customer.lifetime_value,
          expires_at: getExpirationDate(7),
        });
      }

      // 4. Review Target (PRIORITY: LOW)
      if (
        customer.total_visits >= 2 &&
        !customer.google_review_given &&
        daysSinceLastVisit <= 7
      ) {
        leads.push({
          customer_phone: customer.customer_phone,
          customer_name: customer.customer_name,
          lead_segment: "review_target",
          priority: "LOW",
          recommended_action: "Kirim WA: Request Google review (setelah kunjungan terakhir)",
          whatsapp_message_template: generateWhatsAppMessage(customer, "review_target"),
          days_since_last_visit: daysSinceLastVisit,
          average_atv: customer.average_atv,
          total_visits: customer.total_visits,
          lifetime_value: customer.lifetime_value,
          expires_at: getExpirationDate(30),
        });
      }

      // 5. New Customer Welcome (PRIORITY: HIGH)
      if (customer.total_visits === 1 && daysSinceLastVisit <= 7) {
        leads.push({
          customer_phone: customer.customer_phone,
          customer_name: customer.customer_name,
          lead_segment: "new_customer_welcome",
          priority: "HIGH",
          recommended_action: "Kirim WA: Welcome message + info program loyalitas",
          whatsapp_message_template: generateWhatsAppMessage(
            customer,
            "new_customer_welcome"
          ),
          days_since_last_visit: daysSinceLastVisit,
          average_atv: customer.average_atv,
          total_visits: customer.total_visits,
          lifetime_value: customer.lifetime_value,
          expires_at: getExpirationDate(14),
        });
      }
    }

    console.log(`Generated ${leads.length} actionable leads`);

    // Insert leads (replace old ones)
    if (leads.length > 0) {
      const { data, error } = await supabase
        .from("barbershop_actionable_leads")
        .upsert(leads, {
          onConflict: "customer_phone,lead_segment",
          ignoreDuplicates: false,
        });

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${leads.length} actionable leads`,
        leadsGenerated: leads.length,
        segmentBreakdown: {
          high_value_churn: leads.filter((l) => l.lead_segment === "high_value_churn").length,
          coupon_eligible: leads.filter((l) => l.lead_segment === "coupon_eligible").length,
          ready_to_visit: leads.filter((l) => l.lead_segment === "ready_to_visit").length,
          review_target: leads.filter((l) => l.lead_segment === "review_target").length,
          new_customer_welcome: leads.filter((l) => l.lead_segment === "new_customer_welcome")
            .length,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error generating leads:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function generateWhatsAppMessage(customer: any, segment: string): string {
  const name = customer.customer_name || "Bapak/Ibu";

  const messages: Record<string, string> = {
    high_value_churn: `Halo ${name}! 👋

Kami kangen sama ${name}! 😊 Sudah lama ga ketemu nih, ${customer.total_visits}x datang sebelumnya.

Khusus untuk ${name}, ada PROMO COMEBACK SPESIAL! 🎉
✨ Discount 20% untuk service Mastery
✨ Free Hair Tonic senilai Rp 10K

Yuk booking sekarang! Slot terbatas ya! 🚀

Reply "BOOKING" untuk reservasi.`,

    coupon_eligible: `Selamat ${name}! 🎉

Kupon 4+1 kamu AKTIF! 🎫
Sudah ${customer.total_visits}x kunjungan = 1x GRATIS HAIRCUT!

Datang kapan? Mau ambil gratisannya? 😁

Reply "AMBIL" untuk booking slot gratis!`,

    ready_to_visit: `Halo ${name}! 👋

Sudah waktunya refresh penampilan nih! 💈
Biasanya ${name} datang setiap ${customer.average_recency_days || 30} hari.

Mau booking slot minggu ini? Masih ada:
📅 Senin-Jumat: 10.00-20.00
📅 Sabtu-Minggu: 09.00-18.00

Reply "BOOKING" untuk reservasi!`,

    review_target: `Halo ${name}! 🙏

Terima kasih sudah ${customer.total_visits}x percaya sama kami! 🙌

Boleh minta bantuan review di Google Maps? Cuma 1 menit kok! 😊

Link review: [Google Maps URL]

Setiap review = Rp 5K discount next visit! 💰

Terima kasih banyak ya! 🙏`,

    new_customer_welcome: `Welcome ${name}! 👋🎉

Terima kasih sudah coba Barbershop kami! 😊

Tau ga? Kamu masuk program LOYALITAS GRATIS:
🎫 Kunjungan ke-4 = GRATIS HAIRCUT!
💰 Bisa hemat Rp 20-80K per bulan!

Mau daftar? Gratis! Reply "DAFTAR"

See you soon! 🚀`,
  };

  return messages[segment] || "Pesan template tidak tersedia";
}

function getExpirationDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}
