import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

type Stage = {
  name: string;
  objectives: string;
  needs: string;
  feelings: string;
  barriers: string;
};

type JourneyMap = {
  stages: Stage[];
};

export async function POST(req: Request) {

  try {

    const { projectId, personaId, message, journeyMap } = await req.json();

    if (!projectId || !personaId || !message) {
      return NextResponse.json(
        { success: false, error: "Missing projectId or personaId" },
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

    await supabase
      .from("project_ai_chats")
      .insert({
        project_id: projectId,
        module: "journey-map",
        role: "user",
        message
      });

    /* ========================= */
    /* AI Prompt                 */
    /* ========================= */

    const prompt = `
You are a UX expert helping improve a user journey map.

Current Journey Map:
${JSON.stringify(journeyMap, null, 2)}

User request:
${message}

Rules:

1. If the user asks to MODIFY the journey map, return ONLY this structure:

{
 "update": true,
 "stages": [...]
}

2. Do NOT explain the JSON.
3. Do NOT ask for confirmation.
4. Do NOT include extra text.

5. If the user asks for explanation, suggestion, or advice,
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

        const updated: JourneyMap = {
          stages: parsed.stages || []
        };

        /* Save updated journey map */

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

        /* Save assistant message (human readable) */

        const assistantMessage = "Journey map updated successfully.";

        await supabase.from("project_ai_chats").insert({
          project_id: projectId,
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
      /* Not JSON → normal chat */
    }

    /* ========================= */
    /* Save assistant response   */
    /* ========================= */

    await supabase.from("project_ai_chats").insert({
      project_id: projectId,
      module: "journey-map",
      role: "assistant",
      message: cleaned
    });

    return NextResponse.json({
      type: "chat",
      message: cleaned
    });

  } catch (error) {

    console.error("Journey chat error:", error);

    return NextResponse.json(
      { success: false, error: "Chat failed" },
      { status: 500 }
    );

  }

}