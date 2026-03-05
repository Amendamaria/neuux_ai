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
      .from("project_ai_chats")
      .select("role,message")
      .eq("project_id", projectId)
      .eq("module", "journey-map");

    if (error) {

      console.error("Supabase chat fetch error:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );

    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (err) {

    console.error("Journey chat load error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );

  }

}