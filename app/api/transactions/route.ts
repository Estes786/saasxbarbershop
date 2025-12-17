import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/transactions - Get all transactions with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get transactions
    const { data: transactions, error: transError } = await supabaseAdmin
      .from("barbershop_transactions")
      .select("*")
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (transError) throw transError;

    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from("barbershop_transactions")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.transaction_date ||
      !body.customer_phone ||
      !body.customer_name ||
      !body.service_tier ||
      !body.atv_amount
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert transaction
    const { data, error } = await supabaseAdmin
      .from("barbershop_transactions")
      .insert({
        transaction_date: body.transaction_date,
        customer_phone: body.customer_phone,
        customer_name: body.customer_name,
        service_tier: body.service_tier,
        upsell_items: body.upsell_items || null,
        atv_amount: parseFloat(body.atv_amount),
        discount_amount: parseFloat(body.discount_amount || 0),
        is_coupon_redeemed: body.is_coupon_redeemed || false,
        is_google_review_asked: body.is_google_review_asked || false,
        customer_area: body.customer_area || null,
        capster_name: body.capster_name || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update customer profile (create if not exists)
    await updateCustomerProfile(body.customer_phone);

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Transaction created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to update customer profile
async function updateCustomerProfile(customerPhone: string) {
  try {
    // Get all transactions for this customer
    const { data: transactions, error } = await supabaseAdmin
      .from("barbershop_transactions")
      .select("*")
      .eq("customer_phone", customerPhone)
      .order("transaction_date", { ascending: false });

    if (error || !transactions || transactions.length === 0) return;

    const totalVisits = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.net_revenue || 0), 0);
    const averageAtv = totalVisits > 0 ? totalRevenue / totalVisits : 0;
    const lastVisit = transactions[0];
    const firstVisit = transactions[transactions.length - 1];
    
    // Calculate average recency
    let averageRecency = 0;
    if (totalVisits > 1) {
      const dates = transactions.map(t => new Date(t.transaction_date).getTime());
      const gaps = [];
      for (let i = 0; i < dates.length - 1; i++) {
        gaps.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24)); // days
      }
      averageRecency = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    }

    // Determine segment
    let segment = "New";
    if (totalVisits >= 10) segment = "VIP";
    else if (totalVisits >= 3) segment = "Regular";
    
    // Check churn
    const daysSinceLastVisit = Math.floor(
      (Date.now() - new Date(lastVisit.transaction_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit > 60) segment = "Churned";

    // Coupon calculation (4+1 program)
    const couponCount = Math.floor(totalVisits / 4);
    const couponEligible = totalVisits % 4 === 3; // Next visit is free

    // Upsert customer profile
    const { error: upsertError } = await supabaseAdmin
      .from("barbershop_customers")
      .upsert({
        customer_phone: customerPhone,
        customer_name: lastVisit.customer_name,
        customer_area: lastVisit.customer_area,
        total_visits: totalVisits,
        total_revenue: totalRevenue,
        average_atv: averageAtv,
        last_visit_date: lastVisit.transaction_date,
        first_visit_date: firstVisit.transaction_date,
        average_recency_days: Math.round(averageRecency),
        customer_segment: segment,
        lifetime_value: totalRevenue,
        coupon_count: couponCount,
        coupon_eligible: couponEligible,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error("Error updating customer profile:", upsertError);
    }
  } catch (error) {
    console.error("Error in updateCustomerProfile:", error);
  }
}
