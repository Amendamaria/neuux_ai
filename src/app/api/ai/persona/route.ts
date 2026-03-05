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

    const { projectId } = await req.json();

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

    /* Fetch project */

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const prompt = `
Generate 2 realistic UX personas.

Return ONLY JSON array.

[
{
"name":"",
"age":"",
"occupation":"",
"location":"",
"background":"",
"goals":"",
"pain_points":"",
"motivations":"",
"tech_usage":"",
"quote":""
}
]

Project:
Name: ${project.name}
Description: ${project.description}
Target Users: ${project.target_users}
Goal: ${project.goal}
`;

    const aiTextRaw = await aiChat([
      {
        role: "system",
        content: "You are a senior UX strategist. Return JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    const aiText = aiTextRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed: PersonaPayload[] = JSON.parse(aiText);

    /* Delete old personas */

    await supabase
      .from("project_personas")
      .delete()
      .eq("project_id", projectId);

    const insertData = parsed.map((p) => ({
      project_id: projectId,
      name: p.name,
      age: p.age,
      occupation: p.occupation,
      location: p.location,
      background: p.background,
      goals: p.goals,
      pain_points: p.pain_points,
      motivations: p.motivations,
      tech_usage: p.tech_usage,
      quote: p.quote,
    }));

    await supabase.from("project_personas").insert(insertData);

    return NextResponse.json({
      success: true,
      personas: insertData,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { success: false, error: "Persona generation failed" },
      { status: 500 }
    );
  }
}