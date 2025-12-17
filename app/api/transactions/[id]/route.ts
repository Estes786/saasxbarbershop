import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/transactions/[id] - Get transaction by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("barbershop_transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Transaction not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("barbershop_transactions")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update customer profile
    await updateCustomerProfile(body.customer_phone);

    return NextResponse.json({
      success: true,
      data,
      message: "Transaction updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Get transaction before deleting (to update customer profile)
    const { data: transaction } = await supabaseAdmin
      .from("barbershop_transactions")
      .select("customer_phone")
      .eq("id", id)
      .single();

    // Delete transaction
    const { error } = await supabaseAdmin
      .from("barbershop_transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Update customer profile if transaction existed
    if (transaction) {
      await updateCustomerProfile(transaction.customer_phone);
    }

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to update customer profile
async function updateCustomerProfile(customerPhone: string) {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from("barbershop_transactions")
      .select("*")
      .eq("customer_phone", customerPhone)
      .order("transaction_date", { ascending: false });

    if (error || !transactions || transactions.length === 0) {
      // If no more transactions, delete customer profile
      await supabaseAdmin
        .from("barbershop_customers")
        .delete()
        .eq("customer_phone", customerPhone);
      return;
    }

    const totalVisits = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.net_revenue || 0), 0);
    const averageAtv = totalVisits > 0 ? totalRevenue / totalVisits : 0;
    const lastVisit = transactions[0];
    const firstVisit = transactions[transactions.length - 1];
    
    let averageRecency = 0;
    if (totalVisits > 1) {
      const dates = transactions.map(t => new Date(t.transaction_date).getTime());
      const gaps = [];
      for (let i = 0; i < dates.length - 1; i++) {
        gaps.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
      }
      averageRecency = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    }

    let segment = "New";
    if (totalVisits >= 10) segment = "VIP";
    else if (totalVisits >= 3) segment = "Regular";
    
    const daysSinceLastVisit = Math.floor(
      (Date.now() - new Date(lastVisit.transaction_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit > 60) segment = "Churned";

    const couponCount = Math.floor(totalVisits / 4);
    const couponEligible = totalVisits % 4 === 3;

    await supabaseAdmin
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
  } catch (error) {
    console.error("Error in updateCustomerProfile:", error);
  }
}
