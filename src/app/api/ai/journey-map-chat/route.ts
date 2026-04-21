import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// GET (LOAD CHAT)
// =========================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get("projectId");
    const personaId = searchParams.get("personaId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("project_ai_chats")
      .select("role,message")
      .eq("project_id", projectId)
      .eq("module", "journey-map")
      .order("created_at", { ascending: true });

    // ✅ Persona filtering
    if (personaId) {
      query = query.eq("persona_id", personaId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

// =========================
// POST (CHAT + UPDATE)
// =========================

export async function POST(req: Request) {
  try {
    const { projectId, personaId, message, journeyMap } = await req.json();

    if (!projectId || !personaId || !message) {
      return NextResponse.json(
        { success: false, error: "Missing data" },
        { status: 400 }
      );
    }

    // =========================
    // Save user message
    // =========================

    await supabase.from("project_ai_chats").insert({
      project_id: projectId,
      persona_id: personaId, // ✅ FIXED
      module: "journey-map",
      role: "user",
      message
    });

    // =========================
    // AI Prompt
    // =========================

    const prompt = `
You are a UX expert.

Current Journey Map:
${JSON.stringify(journeyMap, null, 2)}

User request:
${message}

Rules:
- If modifying → return JSON:
{ "update": true, "stages": [...] }
- No explanation with JSON
- Otherwise respond normally
`;

    const aiTextRaw = await aiChat([
      { role: "system", content: "You are a UX strategist." },
      { role: "user", content: prompt }
    ]);

    const cleaned = aiTextRaw.replace(/```json|```/g, "").trim();

    // =========================
    // Update mode
    // =========================

    try {
      const parsed = JSON.parse(cleaned);

      if (parsed.update) {

        const updated = {
          stages: parsed.stages || []
        };

        await supabase
          .from("project_journey_maps")
          .upsert(
            {
              project_id: projectId,
              persona_id: personaId,
              journey_data: updated
            },
            { onConflict: "project_id,persona_id" }
          );

        const assistantMessage = "Journey map updated successfully.";

        await supabase.from("project_ai_chats").insert({
          project_id: projectId,
          persona_id: personaId, // ✅ FIXED
          module: "journey-map",
          role: "assistant",
          message: assistantMessage
        });

        return NextResponse.json({
          type: "update",
          message: assistantMessage,
          data: updated
        });
      }

    } catch {
      // ignore JSON error
    }

    // =========================
    // Normal chat
    // =========================

    await supabase.from("project_ai_chats").insert({
      project_id: projectId,
      persona_id: personaId, // ✅ FIXED
      module: "journey-map",
      role: "assistant",
      message: cleaned
    });

    return NextResponse.json({
      type: "chat",
      message: cleaned
    });

  } catch {
    return NextResponse.json(
      { success: false, error: "Chat failed" },
      { status: 500 }
    );
  }
}