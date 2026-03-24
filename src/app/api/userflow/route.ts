import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ========================= */
/* GET - Load Flow + Chat    */
/* ========================= */

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

    /* ========================= */
    /* Fetch Flow                */
    /* ========================= */

    const { data: flowData, error: flowError } = await supabase
      .from("project_user_flows")
      .select("flow_data")
      .eq("project_id", projectId)
      .maybeSingle();

    if (flowError) throw flowError;

    /* ========================= */
    /* Fetch Chat                */
    /* ========================= */

    const { data: chatData, error: chatError } = await supabase
      .from("project_ai_chats")
      .select("role,message")
      .eq("project_id", projectId)
      .eq("module", "userflow")
      .order("created_at", { ascending: true });

    if (chatError) throw chatError;

    return NextResponse.json({
      success: true,
      flow: flowData?.flow_data || null,
      chat: chatData || []
    });

  } catch (error) {
    console.error("Userflow GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load data" },
      { status: 500 }
    );
  }
}