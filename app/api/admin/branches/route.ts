import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/branches
 * Get all branches for a barbershop
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barbershopId = searchParams.get("barbershop_id");
    
    // If no barbershop_id, get all branches (admin use)
    let query = supabaseAdmin
      .from("branches")
      .select("*")
      .order("is_main_branch", { ascending: false })
      .order("created_at", { ascending: true });
    
    if (barbershopId) {
      query = query.eq("barbershop_id", barbershopId);
    }
    
    const { data: branches, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: branches,
      count: branches?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/branches
 * Create new branch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.barbershop_id || !body.branch_name) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: barbershop_id, branch_name" 
        },
        { status: 400 }
      );
    }

    // Prepare branch data
    const branchData = {
      barbershop_id: body.barbershop_id,
      branch_name: body.branch_name,
      branch_code: body.branch_code || null,
      address: body.address || null,
      phone: body.phone || null,
      operating_hours: body.operating_hours || {
        monday: { open: "09:00", close: "21:00" },
        tuesday: { open: "09:00", close: "21:00" },
        wednesday: { open: "09:00", close: "21:00" },
        thursday: { open: "09:00", close: "21:00" },
        friday: { open: "09:00", close: "21:00" },
        saturday: { open: "09:00", close: "21:00" },
        sunday: { open: "09:00", close: "21:00" },
      },
      is_active: body.is_active !== undefined ? body.is_active : true,
      is_main_branch: body.is_main_branch || false,
    };

    // Insert branch
    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert(branchData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Branch created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
