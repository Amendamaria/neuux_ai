import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

/* ========================= */
/* GET - Load Chat History   */
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

    const { data, error } = await supabase
      .from("project_ai_chats")
      .select("role,message")
      .eq("project_id", projectId)
      .eq("module", "userflow")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data ?? []
    });

  } catch (error) {

    console.error("Chat history error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load chat history" },
      { status: 500 }
    );

  }

}


/* ========================= */
/* POST - Send Message       */
/* ========================= */

type FlowNode = {
  id: string;
  label: string;
};

type FlowEdge = {
  from: string;
  to: string;
};

type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export async function POST(req: Request) {

  try {

    const { projectId, message, flow } = await req.json();

    if (!projectId || !message) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    /* Save user message */

    await supabase.from("project_ai_chats").insert({
      project_id: projectId,
      module: "userflow",
      role: "user",
      message
    });

    /* AI Prompt */

    const prompt = `
You are editing a product user flow.

Current Flow:
${JSON.stringify(flow, null, 2)}

User Request:
${message}

If the flow should be modified return JSON:

{
 "update": true,
 "nodes":[
   { "id":"", "label":"" }
 ],
 "edges":[
   { "from":"", "to":"" }
 ]
}

Otherwise respond conversationally.
`;

    const aiTextRaw = await aiChat([
      { role: "system", content: "Return JSON only when modifying the flow." },
      { role: "user", content: prompt }
    ]);

    const cleaned = aiTextRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    /* Try JSON update */

    try {

      const parsed = JSON.parse(cleaned);

      if (parsed.update) {

        const updatedFlow: FlowData = {
          nodes: parsed.nodes || [],
          edges: parsed.edges || []
        };

        await supabase
          .from("project_user_flows")
          .upsert(
            {
              project_id: projectId,
              flow_data: updatedFlow
            },
            { onConflict: "project_id" }
          );

        await supabase.from("project_ai_chats").insert({
          project_id: projectId,
          module: "userflow",
          role: "assistant",
          message: "Flow updated."
        });

        return NextResponse.json({
          type: "update",
          data: updatedFlow
        });

      }

    } catch {}

    /* Normal chat */

    await supabase.from("project_ai_chats").insert({
      project_id: projectId,
      module: "userflow",
      role: "assistant",
      message: cleaned
    });

    return NextResponse.json({
      type: "chat",
      message: cleaned
    });

  } catch (error) {

    console.error("Flow Chat Error:", error);

    return NextResponse.json(
      { success: false, error: "Chat failed" },
      { status: 500 }
    );

  }

}