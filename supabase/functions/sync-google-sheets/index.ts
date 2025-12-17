// ========================================
// EDGE FUNCTION: sync-google-sheets
// ========================================
// Purpose: Sync data from Google Sheets to Supabase
// Trigger: Called by Google Apps Script hourly
// ========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface Transaction {
  transaction_date: string;
  customer_phone: string;
  customer_name?: string;
  service_tier: "Basic" | "Premium" | "Mastery";
  upsell_items?: string;
  atv_amount: number;
  discount_amount: number;
  is_coupon_redeemed: boolean;
  is_google_review_asked: boolean;
  customer_area?: string;
  capster_name?: string;
}

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

    // Only accept POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { transactions } = await req.json();

    if (!transactions || !Array.isArray(transactions)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: transactions array required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${transactions.length} transactions...`);

    // Insert transactions
    const { data, error } = await supabase
      .from("barbershop_transactions")
      .upsert(transactions, {
        onConflict: "customer_phone,transaction_date", // Prevent duplicates
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Database insertion failed", details: error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Trigger customer profile update
    await updateCustomerProfiles(supabase);

    // Trigger daily analytics calculation
    await calculateDailyAnalytics(supabase);

    // Generate actionable leads
    await generateActionableLeads(supabase);

    console.log("Sync completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${transactions.length} transactions`,
        processedCount: transactions.length,
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

async function updateCustomerProfiles(supabase: any) {
  console.log("Updating customer profiles...");

  // Get all customers with their transaction history
  const { data: customers, error } = await supabase.rpc("update_all_customer_profiles");

  if (error) {
    console.error("Error updating customer profiles:", error);
    throw error;
  }

  console.log("Customer profiles updated");
}

async function calculateDailyAnalytics(supabase: any) {
  console.log("Calculating daily analytics...");

  const { data, error } = await supabase.rpc("calculate_daily_analytics");

  if (error) {
    console.error("Error calculating daily analytics:", error);
    throw error;
  }

  console.log("Daily analytics calculated");
}

async function generateActionableLeads(supabase: any) {
  console.log("Generating actionable leads...");

  const { data, error } = await supabase.rpc("generate_actionable_leads");

  if (error) {
    console.error("Error generating leads:", error);
    throw error;
  }

  console.log("Actionable leads generated");
}
