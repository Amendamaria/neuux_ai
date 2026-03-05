import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

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

    /* ========================= */
    /* Save user message         */
    /* ========================= */

    await supabase.from("project_ai_chats").insert({
      project_id: projectId,
      module: "userflow",
      role: "user",
      message
    });

    /* ========================= */
    /* AI Prompt                 */
    /* ========================= */

    const prompt = `
You are a UX expert helping improve a product user flow.

Current Flow:
${JSON.stringify(flow, null, 2)}

User Request:
${message}

Rules:

1. If the user asks to MODIFY the flow return ONLY this JSON structure:

{
 "update": true,
 "nodes":[
   { "id":"", "label":"" }
 ],
 "edges":[
   { "from":"", "to":"" }
 ]
}

2. Do NOT explain the JSON.
3. Do NOT include extra text.

4. If the user is asking advice, explanation, or suggestions,
   respond normally in plain text.
`;

    const aiTextRaw = await aiChat([
      { role: "system", content: "You are a senior UX strategist." },
      { role: "user", content: prompt }
    ]);

    const cleaned = aiTextRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    /* ========================= */
    /* Try JSON update           */
    /* ========================= */

    try {

      const parsed = JSON.parse(cleaned);

      if (parsed.update) {

        const updatedFlow: FlowData = {
          nodes: parsed.nodes || [],
          edges: parsed.edges || []
        };

        /* Save updated flow */

        await supabase
          .from("project_user_flows")
          .upsert(
            {
              project_id: projectId,
              flow_data: updatedFlow
            },
            { onConflict: "project_id" }
          );

        /* Store readable assistant message */

        const assistantMessage = "User flow updated successfully.";

        await supabase.from("project_ai_chats").insert({
          project_id: projectId,
          module: "userflow",
          role: "assistant",
          message: assistantMessage
        });

        return NextResponse.json({
          type: "update",
          message: assistantMessage,
          data: updatedFlow
        });

      }

    } catch {
      /* Not JSON → normal chat */
    }

    /* ========================= */
    /* Conversational response   */
    /* ========================= */

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