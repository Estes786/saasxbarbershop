import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/branches/[id]/capsters
 * Assign capster to branch
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: branchId } = await params;
  try {
    const body = await request.json();

    if (!body.capster_id) {
      return NextResponse.json(
        { success: false, error: "Missing required field: capster_id" },
        { status: 400 }
      );
    }

    // Verify branch exists
    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id, barbershop_id")
      .eq("id", branchId)
      .single();

    if (branchError || !branch) {
      return NextResponse.json(
        { success: false, error: "Branch not found" },
        { status: 404 }
      );
    }

    // Verify capster exists and belongs to same barbershop
    const { data: capster, error: capsterError } = await supabaseAdmin
      .from("capsters")
      .select("id, barbershop_id, capster_name")
      .eq("id", body.capster_id)
      .single();

    if (capsterError || !capster) {
      return NextResponse.json(
        { success: false, error: "Capster not found" },
        { status: 404 }
      );
    }

    if (capster.barbershop_id !== branch.barbershop_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Capster must belong to the same barbershop as the branch",
        },
        { status: 400 }
      );
    }

    // Assign capster to branch
    const { data, error } = await supabaseAdmin
      .from("capsters")
      .update({ branch_id: branchId })
      .eq("id", body.capster_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: `Capster ${capster.capster_name} assigned to branch successfully`,
    });
  } catch (error: any) {
    console.error("Error assigning capster to branch:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/branches/[id]/capsters
 * Remove capster from branch
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: branchId } = await params;
  try {
    const searchParams = request.nextUrl.searchParams;
    const capsterId = searchParams.get("capster_id");

    if (!capsterId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: capster_id" },
        { status: 400 }
      );
    }

    // Remove capster from branch (set branch_id to NULL)
    const { data, error } = await supabaseAdmin
      .from("capsters")
      .update({ branch_id: null })
      .eq("id", capsterId)
      .eq("branch_id", branchId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Capster not found in this branch" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Capster removed from branch successfully",
    });
  } catch (error: any) {
    console.error("Error removing capster from branch:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
