import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/analytics/service-distribution - Get service tier distribution
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabaseAdmin
      .from("barbershop_transactions")
      .select("service_tier, net_revenue, atv_amount");

    // Apply date filters if provided
    if (startDate) {
      query = query.gte("transaction_date", startDate);
    }
    if (endDate) {
      query = query.lte("transaction_date", endDate);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // Calculate distribution
    const distribution: { [key: string]: {
      service_tier: string;
      total_count: number;
      total_revenue: number;
      avg_atv: number;
    }} = {};

    transactions?.forEach((t: any) => {
      if (!distribution[t.service_tier]) {
        distribution[t.service_tier] = {
          service_tier: t.service_tier,
          total_count: 0,
          total_revenue: 0,
          avg_atv: 0,
        };
      }

      distribution[t.service_tier].total_count++;
      distribution[t.service_tier].total_revenue += parseFloat(t.net_revenue || 0);
    });

    // Calculate averages
    const results = Object.values(distribution).map(d => ({
      ...d,
      avg_atv: d.total_count > 0 ? d.total_revenue / d.total_count : 0,
    })).sort((a, b) => b.total_count - a.total_count);

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error fetching service distribution:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
