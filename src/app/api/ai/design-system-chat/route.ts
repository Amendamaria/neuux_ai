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
      .from("project_chat")
      .select("role,content")
      .eq("project_id", projectId)
      .eq("module", "design-system")
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

    console.error("Design system chat history error:", error);

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

    const { projectId, message, designSystem } = await req.json();

    if (!message || !projectId) {
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
      module: "design-system",
      role: "user",
      content: message
    });

    const prompt = `
You are editing a UI design system.

Current system:
${JSON.stringify(designSystem, null, 2)}

User request:
${message}

If modification required return JSON:

{
 "update": true,
 "design_system": {}
}

Otherwise respond conversationally.
`;

    const aiTextRaw = await aiChat([
      { role: "system", content: "Return JSON only when editing." },
      { role: "user", content: prompt }
    ]);

    const cleaned = aiTextRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {

      const parsed = JSON.parse(cleaned);

      if (parsed.update) {

        await supabase
          .from("project_design_systems")
          .upsert(
            {
              project_id: projectId,
              design_system: parsed.design_system
            },
            { onConflict: "project_id" }
          );

        const assistantMsg = "Design system updated successfully.";

        await supabase.from("project_chat").insert({
          project_id: projectId,
          module: "design-system",
          role: "assistant",
          content: assistantMsg
        });

        return NextResponse.json({
          type: "update",
          data: parsed.design_system,
          message: assistantMsg
        });

      }

    } catch {}

    /* Normal chat */

    await supabase.from("project_chat").insert({
      project_id: projectId,
      module: "design-system",
      role: "assistant",
      content: cleaned
    });

    return NextResponse.json({
      type: "chat",
      message: cleaned
    });

  } catch (error) {

    console.error("Design system chat error:", error);

    return NextResponse.json(
      { success: false, error: "Chat failed" },
      { status: 500 }
    );
  }
}