import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

/* ================= TYPES ================= */

type Persona = {
  name: string;
  age: string;
  occupation: string;
  location: string;
  background: string;
  goals: string;
  pain_points: string;
  motivations: string;
  tech_usage: string;
  quote: string;
};

type PersonaUpdate = {
  persona_name: string;
  field: string;
  new_value: string;
};

export async function POST(req: Request) {

  try {

    const {
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {

      return NextResponse.json(
        { success: false, error: "Missing environment variables" },
        { status: 500 }
      );

    }

    const { projectId, activeTab, message } = await req.json();

    if (!projectId || !activeTab || !message) {

      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );

    }

    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    /* ================= FETCH PROJECT ================= */

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) {

      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );

    }

    /* ================================================= */
    /* OVERVIEW MODULE                                   */
    /* ================================================= */

    if (activeTab === "overview") {

      const prompt = `
You are a UX strategist helping improve a UX project overview.

Project:
${JSON.stringify(project, null, 2)}

User request:
${message}

Rules:

1. If the user asks to modify a section (summary, problem_statement, ux_objectives, success_metrics),
   return ONLY this structure:

{
 "field": "section_name",
 "new_value": "updated text"
}

2. Do NOT explain that you are returning JSON.
3. Do NOT ask for confirmation.
4. Do NOT include any extra text.
5. If the user is asking for advice, explanation, or suggestions, respond normally in plain text.
`;

      let aiText = await aiChat([
        { role: "system", content: "You are a senior UX strategist." },
        { role: "user", content: prompt }
      ]);

      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

      try {

        const parsed = JSON.parse(aiText);

        const allowedFields = [
          "summary",
          "problem_statement",
          "ux_objectives",
          "success_metrics",
        ];

        if (parsed.field && allowedFields.includes(parsed.field)) {

          await supabase
            .from("project_overview")
            .update({ [parsed.field]: parsed.new_value })
            .eq("project_id", projectId);

          return NextResponse.json({
            success: true,
            type: "update",
            message: `${parsed.field.replace(/_/g, " ")} updated successfully.`,
            data: parsed
          });

        }

      } catch {}

      return NextResponse.json({
        success: true,
        type: "chat",
        message: aiText
      });

    }

    /* ================================================= */
    /* PERSONAS MODULE                                   */
    /* ================================================= */

    if (activeTab === "personas") {

      const { data: personas } = await supabase
        .from("project_personas")
        .select("*")
        .eq("project_id", projectId);

      const prompt = `
You are a UX strategist managing personas.

Existing personas:
${JSON.stringify(personas, null, 2)}

Project:
Name: ${project.name}
Description: ${project.description}

User request:
${message}

Rules:

If generating a NEW persona return JSON array:

[
  {
    "name": "",
    "age": "",
    "occupation": "",
    "location": "",
    "background": "",
    "goals": "",
    "pain_points": "",
    "motivations": "",
    "tech_usage": "",
    "quote": ""
  }
]

If updating an existing persona return:

{
 "persona_name": "",
 "field": "",
 "new_value": ""
}

If the user is asking advice or explanation, respond normally.
`;

      let aiText = await aiChat([
        { role: "system", content: "Return JSON only when updating data." },
        { role: "user", content: prompt }
      ]);

      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

      try {

        const parsed = JSON.parse(aiText);

        /* -------- NEW PERSONA -------- */

        if (Array.isArray(parsed)) {

          const insertData = parsed.map((p: Persona) => ({
            project_id: projectId,
            ...p
          }));

          await supabase.from("project_personas").insert(insertData);

          return NextResponse.json({
            success: true,
            type: "update",
            message: "New persona generated successfully.",
            data: parsed
          });

        }

        /* -------- UPDATE PERSONA -------- */

        const update: PersonaUpdate = parsed;

        if (update.persona_name && update.field && update.new_value) {

          const { data: target } = await supabase
            .from("project_personas")
            .select("id")
            .eq("project_id", projectId)
            .ilike("name", `%${update.persona_name}%`)
            .maybeSingle();

          if (target) {

            await supabase
              .from("project_personas")
              .update({ [update.field]: update.new_value })
              .eq("id", target.id);

            return NextResponse.json({
              success: true,
              type: "update",
              message: `${update.persona_name}'s ${update.field.replace(/_/g," ")} updated.`,
              data: update
            });

          }

        }

      } catch {}

      return NextResponse.json({
        success: true,
        type: "chat",
        message: aiText
      });

    }

    /* ================================================= */
    /* CASE STUDY MODULE                                 */
    /* ================================================= */

    if (activeTab === "case-study") {

      const prompt = `
You are generating UX case study content.

Project:
${JSON.stringify(project, null, 2)}

User request:
${message}
`;

      const aiText = await aiChat([
        { role: "system", content: "You are a senior UX strategist." },
        { role: "user", content: prompt }
      ]);

      return NextResponse.json({
        success: true,
        type: "chat",
        message: aiText
      });

    }

    return NextResponse.json(
      { success: false, error: "Invalid module" },
      { status: 400 }
    );

  } catch (error: unknown) {

    console.error("AI Chat Error:", error);

    const message =
      error instanceof Error ? error.message : "Server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );

  }
}