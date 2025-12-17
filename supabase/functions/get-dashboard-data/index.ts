// ========================================
// EDGE FUNCTION: get-dashboard-data
// ========================================
// Purpose: Get all dashboard data for OASIS BI PRO frontend
// Trigger: Called by Next.js frontend on page load
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
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse query parameters
    const url = new URL(req.url);
    const month = url.searchParams.get("month") || new Date().getMonth() + 1;
    const year = url.searchParams.get("year") || new Date().getFullYear();

    console.log(`Fetching dashboard data for ${month}/${year}...`);

    // Parallel fetch all dashboard data
    const [khlProgress, recentTransactions, dailyAnalytics, actionableLeads, serviceDistribution] =
      await Promise.all([
        getKHLProgress(supabase, Number(month), Number(year)),
        getRecentTransactions(supabase),
        getDailyAnalytics(supabase),
        getActionableLeads(supabase),
        getServiceDistribution(supabase),
      ]);

    const dashboardData = {
      khl: khlProgress,
      recentTransactions,
      dailyAnalytics,
      actionableLeads,
      serviceDistribution,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(dashboardData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch dashboard data", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ========================================
// DATA FETCHING FUNCTIONS
// ========================================

async function getKHLProgress(supabase: any, month: number, year: number) {
  const { data, error } = await supabase.rpc("get_khl_progress", {
    p_month: month,
    p_year: year,
  });

  if (error) {
    console.error("Error fetching KHL progress:", error);
    throw error;
  }

  return data[0] || null;
}

async function getRecentTransactions(supabase: any, limit = 50) {
  const { data, error } = await supabase
    .from("barbershop_transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent transactions:", error);
    throw error;
  }

  return data;
}

async function getDailyAnalytics(supabase: any, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("barbershop_analytics_daily")
    .select("*")
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching daily analytics:", error);
    throw error;
  }

  return data;
}

async function getActionableLeads(supabase: any) {
  const { data, error } = await supabase
    .from("barbershop_actionable_leads")
    .select(`
      *,
      barbershop_customers (
        customer_name,
        customer_area,
        total_visits,
        lifetime_value
      )
    `)
    .eq("is_contacted", false)
    .gt("expires_at", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("generated_at", { ascending: false });

  if (error) {
    console.error("Error fetching actionable leads:", error);
    throw error;
  }

  return data;
}

async function getServiceDistribution(supabase: any) {
  const { data, error } = await supabase.rpc("get_service_distribution");

  if (error) {
    console.error("Error fetching service distribution:", error);
    throw error;
  }

  return data;
}
