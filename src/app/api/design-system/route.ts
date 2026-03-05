import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {

  try {

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("project_design_systems")
      .select("design_system")
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data?.design_system || null
    });

  } catch (error) {

    console.error("Fetch design system error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch design system" },
      { status: 500 }
    );
  }
}