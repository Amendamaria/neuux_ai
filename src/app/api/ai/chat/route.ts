import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

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
      GITHUB_TOKEN,
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (!GITHUB_TOKEN || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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

    const openai = new OpenAI({
      apiKey: GITHUB_TOKEN,
      baseURL: "https://models.inference.ai.azure.com",
    });

    // ================= FETCH PROJECT =================

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // =================================================
    // OVERVIEW MODULE
    // =================================================
    if (activeTab === "overview") {
      const prompt = `
You are editing a UX project overview.

Project:
${JSON.stringify(project, null, 2)}

User request:
${message}

If user wants to update a section (summary, problem_statement, ux_objectives, success_metrics),
return JSON:

{
  "field": "",
  "new_value": ""
}

Otherwise respond conversationally.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.6,
        messages: [
          { role: "system", content: "Follow instructions strictly." },
          { role: "user", content: prompt },
        ],
      });

      let aiText = response.choices?.[0]?.message?.content?.trim() || "";
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
            message: `Updated ${parsed.field} successfully.`,
          });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        type: "chat",
        message: aiText,
      });
    }

    // =================================================
    // PERSONAS MODULE
    // =================================================
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

If generating a NEW persona, return ONLY JSON array:

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

If updating existing persona, return:

{
  "persona_name": "",
  "field": "",
  "new_value": ""
}

Otherwise respond conversationally.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: "Return valid JSON when required." },
          { role: "user", content: prompt },
        ],
      });

      let aiText = response.choices?.[0]?.message?.content?.trim() || "";
      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

      // ---------------------------
      // Try NEW persona generation
      // ---------------------------
      try {
        const parsed = JSON.parse(aiText);

        // If array → new persona(s)
        if (Array.isArray(parsed)) {
          const newPersonas: Persona[] = parsed;

          const insertData = newPersonas.map((p) => ({
            project_id: projectId,
            name: p.name ?? "",
            age: p.age ?? "",
            occupation: p.occupation ?? "",
            location: p.location ?? "",
            background: p.background ?? "",
            goals: p.goals ?? "",
            pain_points: p.pain_points ?? "",
            motivations: p.motivations ?? "",
            tech_usage: p.tech_usage ?? "",
            quote: p.quote ?? "",
          }));

          await supabase.from("project_personas").insert(insertData);

          const formatted = newPersonas
  .map(
    (p) => `
Here is a new persona:

Name: ${p.name}
Age: ${p.age}
Occupation: ${p.occupation}
Location: ${p.location}

Background:
${p.background}

Goals:
${p.goals}

Pain Points:
${p.pain_points}

Motivations:
${p.motivations}

Tech Usage:
${p.tech_usage}

Quote:
"${p.quote}"
`
  )
  .join("\n\n");

return NextResponse.json({
  success: true,
  type: "chat",
  message: formatted.trim(),
});
        }

        // ---------------------------
        // Try persona update
        // ---------------------------
        const update: PersonaUpdate = parsed;

        const allowedFields = [
          "name",
          "age",
          "occupation",
          "location",
          "background",
          "goals",
          "pain_points",
          "motivations",
          "tech_usage",
          "quote",
        ];

        if (
          update.persona_name &&
          allowedFields.includes(update.field)
        ) {
          const { data: target } = await supabase
            .from("project_personas")
            .select("id")
            .eq("project_id", projectId)
            .ilike("name", `%${update.persona_name}%`)
            .single();

          if (target) {
            await supabase
              .from("project_personas")
              .update({ [update.field]: update.new_value })
              .eq("id", target.id);

            return NextResponse.json({
              success: true,
              type: "update",
              message: `Updated ${update.persona_name}'s ${update.field}.`,
            });
          }
        }
      } catch {}

      return NextResponse.json({
        success: true,
        type: "chat",
        message: aiText,
      });
    }

    // =================================================
    // CASE STUDY MODULE
    // =================================================
    if (activeTab === "case-study") {
      const prompt = `
You are generating professional UX case study content.

Project:
${JSON.stringify(project, null, 2)}

User request:
${message}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are a senior UX strategist." },
          { role: "user", content: prompt },
        ],
      });

      const aiText =
        response.choices?.[0]?.message?.content?.trim() || "";

      return NextResponse.json({
        success: true,
        type: "chat",
        message: aiText,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid tab" },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}