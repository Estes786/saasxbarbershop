import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/branches/[id]
 * Get single branch by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: branchId } = await params;
  try {
  const { id: branchId } = await params;

    const { data: branch, error } = await supabaseAdmin
      .from("branches")
      .select("*")
      .eq("id", branchId)
      .single();

    if (error) throw error;

    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Branch not found" },
        { status: 404 }
      );
    }

    // Get capsters assigned to this branch
    const { data: capsters, error: capstersError } = await supabaseAdmin
      .from("capsters")
      .select("id, capster_name, phone, specialization, rating, is_available")
      .eq("branch_id", branchId)
      .eq("is_active", true);

    if (capstersError) console.error("Error fetching capsters:", capstersError);

    return NextResponse.json({
      success: true,
      data: {
        ...branch,
        capsters: capsters || [],
      },
    });
  } catch (error: any) {
    console.error("Error fetching branch:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/branches/[id]
 * Update branch by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: branchId } = await params;
  try {
    const body = await request.json();

    // Prepare update data (only allow specific fields)
    const updateData: any = {};
    
    if (body.branch_name !== undefined) updateData.branch_name = body.branch_name;
    if (body.branch_code !== undefined) updateData.branch_code = body.branch_code;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.operating_hours !== undefined) updateData.operating_hours = body.operating_hours;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_main_branch !== undefined) updateData.is_main_branch = body.is_main_branch;

    updateData.updated_at = new Date().toISOString();

    // Update branch
    const { data, error } = await supabaseAdmin
      .from("branches")
      .update(updateData)
      .eq("id", branchId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Branch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Branch updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/branches/[id]
 * Delete branch by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: branchId } = await params;
  try {

    // Check if branch has capsters or bookings
    const { count: capsterCount } = await supabaseAdmin
      .from("capsters")
      .select("*", { count: "exact", head: true })
      .eq("branch_id", branchId);

    const { count: bookingCount } = await supabaseAdmin
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("branch_id", branchId);

    if ((capsterCount || 0) > 0 || (bookingCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete branch with assigned capsters or bookings. Please reassign them first.",
          details: {
            capsters: capsterCount || 0,
            bookings: bookingCount || 0,
          },
        },
        { status: 400 }
      );
    }

    // Delete branch
    const { error } = await supabaseAdmin
      .from("branches")
      .delete()
      .eq("id", branchId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
