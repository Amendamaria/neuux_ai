import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

type PersonaPayload = {
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, messages } = body;

    const {
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // ================= PROJECT =================

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

    // ================= EXISTING PERSONAS =================

    const { data: personas } = await supabase
      .from("project_personas")
      .select("*")
      .eq("project_id", projectId);

    // ================= CONTEXT =================

    const context = `
You are a UX Persona Expert.

Project:
Name: ${project.name}
Description: ${project.description}
Target Users: ${project.target_users}
Goal: ${project.goal}

Existing Personas:
${JSON.stringify(personas || [], null, 2)}

RULES:
- Only talk about personas
- Answer based on existing personas
- Improve or explain personas
- Do NOT generate unrelated content
`;

    // ================= MODE 1: GENERATE PERSONAS =================

    const isFirst = !messages || messages.length === 0;

    if (isFirst) {
      const prompt = `
Generate 2 realistic UX personas.

Return ONLY JSON array.

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
`;

      const aiTextRaw = await aiChat([
        { role: "system", content: context },
        { role: "user", content: prompt },
      ]);

      const aiText = aiTextRaw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsed: PersonaPayload[] = [];

      try {
        parsed = JSON.parse(aiText);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid AI response format" },
          { status: 500 }
        );
      }

      if (!Array.isArray(parsed)) {
        return NextResponse.json(
          { success: false, error: "No personas generated" },
          { status: 500 }
        );
      }

      // Clear old personas
      await supabase
        .from("project_personas")
        .delete()
        .eq("project_id", projectId);

      const insertData = parsed.map((p) => ({
        project_id: projectId,
        name: p.name || "",
        age: p.age || "",
        occupation: p.occupation || "",
        location: p.location || "",
        background: p.background || "",
        goals: p.goals || "",
        pain_points: p.pain_points || "",
        motivations: p.motivations || "",
        tech_usage: p.tech_usage || "",
        quote: p.quote || "",
      }));

      await supabase.from("project_personas").insert(insertData);

      return NextResponse.json({
        success: true,
        personas: insertData,
      });
    }

    // ================= MODE 2: CHAT =================

    const aiText = await aiChat([
      {
        role: "system",
        content: context,
      },
      ...messages.slice(-5),
    ]);

    return NextResponse.json({
      success: true,
      content: aiText,
    });

  } catch (error) {
    console.error("Persona AI Error:", error);

    return NextResponse.json(
      { success: false, error: "Persona generation failed" },
      { status: 500 }
    );
  }
}