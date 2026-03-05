import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

/* ============================ */
/* Supabase Client              */
/* ============================ */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ============================ */
/* GET Journey (for refresh)    */
/* ============================ */

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);

  const projectId = searchParams.get("projectId");
  const personaId = searchParams.get("personaId");

  if (!projectId || !personaId) {
    return NextResponse.json(
      { success: false, error: "Missing parameters" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("project_journey_maps")
    .select("journey_data")
    .eq("project_id", projectId)
    .eq("persona_id", personaId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: data?.journey_data || null
  });
}


/* ============================ */
/* POST Generate Journey        */
/* ============================ */

export async function POST(req: Request) {

  try {

    const { projectId, personaId } = await req.json();

    if (!projectId || !personaId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId or personaId" },
        { status: 400 }
      );
    }

    /* ============================ */
    /* Fetch Project Overview       */
    /* ============================ */

    const { data: overview } = await supabase
      .from("project_overview")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    const { data: persona } = await supabase
      .from("project_personas")
      .select("*")
      .eq("id", personaId)
      .maybeSingle();

    if (!overview || !persona) {
      return NextResponse.json(
        { success: false, error: "Overview or Persona not found" },
        { status: 404 }
      );
    }

    /* ============================ */
    /* AI Prompt                    */
    /* ============================ */

    const prompt = `
You are a senior UX strategist.

PROJECT:
${overview.summary}

PROBLEM:
${overview.problem_statement}

PERSONA:
Name: ${persona.name}
Age: ${persona.age}
Occupation: ${persona.occupation}
Goals: ${persona.goals}
Pain Points: ${persona.pain_points}

Generate a UX journey map.

Return JSON only:

{
 "stages":[
  {
   "stage":"",
   "user_actions":[],
   "user_thoughts":[],
   "pain_points":[],
   "opportunities":[]
  }
 ]
}
`;

    const aiText = await aiChat([
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt }
    ]);

    const cleaned = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    const parsed = JSON.parse(cleaned.slice(start, end + 1));

    /* ============================ */
    /* Save Journey                 */
    /* ============================ */

    await supabase
      .from("project_journey_maps")
      .upsert({
        project_id: projectId,
        persona_id: personaId,
        journey_data: parsed
      });

    return NextResponse.json({
      success: true,
      data: parsed
    });

  } catch (error) {

    console.error("Journey generation error:", error);

    return NextResponse.json(
      { success: false, error: "Journey generation failed" },
      { status: 500 }
    );
  }
}