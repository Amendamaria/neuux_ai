import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

type Screen = {
  name: string;
  sections: string[];
};

type WireframeData = {
  screens: Screen[];
};

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
      .from("project_chat")
      .select("role,content")
      .eq("project_id", projectId)
      .eq("module", "wireframe")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((m) => ({
        role: m.role,
        message: m.content
      }))
    });

  } catch (error) {

    console.error("Wireframe chat history error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}


/* ========================= */
/* POST - Chat + Update      */
/* ========================= */

export async function POST(req: Request) {

  try {

    const { projectId, message, wireframes } = await req.json();

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

    await supabase.from("project_chat").insert({
      project_id: projectId,
      module: "wireframe",
      role: "user",
      content: message
    });

    const prompt = `
You are a UX wireframe assistant.

Current wireframes:
${JSON.stringify(wireframes, null, 2)}

User request:
${message}

Rules:
- If the user asks to modify wireframes, return JSON in this format:

{
 "update": true,
 "screens":[
   { "name":"", "sections":[] }
 ]
}

- If the user is asking a question or discussion, reply as a normal short message (NOT JSON).
`;

    const aiTextRaw = await aiChat([
      { role: "system", content: "You are a UX wireframe assistant." },
      { role: "user", content: prompt }
    ]);

    const cleaned = aiTextRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    /* Try to detect update JSON */

    try {

      const parsed = JSON.parse(cleaned);

      if (parsed.update) {

        const updated: WireframeData = {
          screens: parsed.screens || []
        };

        await supabase
          .from("project_wireframes")
          .upsert(
            {
              project_id: projectId,
              wireframe_data: updated
            },
            { onConflict: "project_id" }
          );

        const assistantMessage = "Wireframe updated successfully.";

        await supabase.from("project_chat").insert({
          project_id: projectId,
          module: "wireframe",
          role: "assistant",
          content: assistantMessage
        });

        return NextResponse.json({
          type: "update",
          message: assistantMessage,
          data: updated
        });
      }

    } catch {}

    /* Normal chat response */

    const normalMessage = cleaned;

    await supabase.from("project_chat").insert({
      project_id: projectId,
      module: "wireframe",
      role: "assistant",
      content: normalMessage
    });

    return NextResponse.json({
      type: "chat",
      message: normalMessage
    });

  } catch (error) {

    console.error("Wireframe chat error:", error);

    return NextResponse.json(
      { success: false, error: "Chat failed" },
      { status: 500 }
    );
  }
}