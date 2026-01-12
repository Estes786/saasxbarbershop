// ========================================
// EDGE FUNCTION: update-customer-profiles
// ========================================
// Purpose: Batch update all customer profiles with calculated metrics
// Trigger: Scheduled (daily) or manual trigger
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

    console.log("Starting customer profile update...");

    // Get all unique customers from transactions
    const { data: uniqueCustomers, error: customersError } = await supabase
      .from("barbershop_transactions")
      .select("customer_phone, customer_name, customer_area")
      .order("transaction_date", { ascending: false });

    if (customersError) throw customersError;

    // Group by phone number
    const customerMap = new Map();
    uniqueCustomers?.forEach((customer) => {
      if (!customerMap.has(customer.customer_phone)) {
        customerMap.set(customer.customer_phone, customer);
      }
    });

    console.log(`Found ${customerMap.size} unique customers`);

    // Process each customer
    const updates = [];
    for (const [phone, customer] of customerMap) {
      const profile = await calculateCustomerMetrics(supabase, phone);
      updates.push({
        customer_phone: phone,
        customer_name: customer.customer_name || "Unknown",
        customer_area: customer.customer_area,
        ...profile,
      });
    }

    // Batch upsert customer profiles
    const { data, error } = await supabase
      .from("barbershop_customers")
      .upsert(updates, {
        onConflict: "customer_phone",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Error updating customer profiles:", error);
      throw error;
    }

    console.log(`Successfully updated ${updates.length} customer profiles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updates.length} customer profiles`,
        profilesUpdated: updates.length,
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
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

async function calculateCustomerMetrics(supabase: any, customerPhone: string) {
  // Get all transactions for this customer
  const { data: transactions, error } = await supabase
    .from("barbershop_transactions")
    .select("*")
    .eq("customer_phone", customerPhone)
    .order("transaction_date", { ascending: true });

  if (error) throw error;

  if (!transactions || transactions.length === 0) {
    return {
      total_visits: 0,
      total_revenue: 0,
      average_atv: 0,
      last_visit_date: null,
      first_visit_date: null,
      average_recency_days: null,
      customer_segment: "New",
      lifetime_value: 0,
      coupon_count: 0,
      coupon_eligible: false,
      churn_risk_score: 0,
      next_visit_prediction: null,
    };
  }

  // Calculate metrics
  const totalVisits = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.net_revenue || 0), 0);
  const averageAtv = totalRevenue / totalVisits;

  const firstVisit = new Date(transactions[0].transaction_date);
  const lastVisit = new Date(transactions[transactions.length - 1].transaction_date);

  // Calculate average recency (days between visits)
  let totalDaysBetweenVisits = 0;
  for (let i = 1; i < transactions.length; i++) {
    const prevDate = new Date(transactions[i - 1].transaction_date);
    const currDate = new Date(transactions[i].transaction_date);
    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    totalDaysBetweenVisits += daysDiff;
  }
  const averageRecencyDays = totalVisits > 1 ? Math.floor(totalDaysBetweenVisits / (totalVisits - 1)) : null;

  // Calculate days since last visit
  const daysSinceLastVisit = Math.floor(
    (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Churn risk score (0-1)
  let churnRisk = 0;
  if (averageRecencyDays && daysSinceLastVisit > averageRecencyDays * 1.5) {
    churnRisk = Math.min(1.0, daysSinceLastVisit / (averageRecencyDays * 2));
  }

  // Adjust for loyalty
  if (totalVisits >= 10) {
    churnRisk *= 0.7;
  } else if (totalVisits >= 5) {
    churnRisk *= 0.85;
  }

  // Customer segmentation
  let segment = "New";
  if (totalVisits >= 10 && averageAtv > 50000) {
    segment = "VIP";
  } else if (totalVisits >= 5) {
    segment = "Regular";
  } else if (churnRisk > 0.7) {
    segment = "Churned";
  }

  // Coupon eligibility (4+1 system)
  const couponCount = Math.floor(totalVisits / 4);
  const couponEligible = totalVisits % 4 === 0 && totalVisits > 0;

  // Next visit prediction
  let nextVisitPrediction = null;
  if (averageRecencyDays) {
    nextVisitPrediction = new Date(lastVisit);
    nextVisitPrediction.setDate(nextVisitPrediction.getDate() + averageRecencyDays);
  }

  return {
    total_visits: totalVisits,
    total_revenue: totalRevenue,
    average_atv: averageAtv,
    last_visit_date: lastVisit.toISOString(),
    first_visit_date: firstVisit.toISOString(),
    average_recency_days: averageRecencyDays,
    customer_segment: segment,
    lifetime_value: totalRevenue,
    coupon_count: couponCount,
    coupon_eligible: couponEligible,
    churn_risk_score: Math.round(churnRisk * 100) / 100,
    next_visit_prediction: nextVisitPrediction?.toISOString(),
    updated_at: new Date().toISOString(),
  };
}
