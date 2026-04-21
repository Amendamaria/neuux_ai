import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

type JourneyStage = {
  stage: string;
  user_actions: string[];
  user_thoughts: string[];
  pain_points: string[];
  opportunities: string[];
};

type JourneyData = {
  stages: JourneyStage[];
};



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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("project_journey_maps")
    .select("journey_data")
    .eq("project_id", projectId)
    .eq("persona_id", personaId)
    .maybeSingle();

  if (error) {
    console.error("Fetch Journey Error:", error);

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



export async function POST(req: Request) {

  try {

    const {
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    } = process.env;

    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing environment variables" },
        { status: 500 }
      );
    }

    const { projectId, personaId } = await req.json();

    if (!projectId || !personaId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId or personaId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );


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

Return STRICT JSON only:

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


    const aiTextRaw = await aiChat([
      {
        role: "system",
        content:
          "You are a senior UX strategist. Return only JSON without explanations."
      },
      {
        role: "user",
        content: prompt
      }
    ]);



    const cleaned = aiTextRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.error("AI RESPONSE:", cleaned);
      throw new Error("AI returned invalid JSON format");
    }

    let parsed: JourneyData;

    try {

      const json = cleaned.slice(start, end + 1);

      parsed = JSON.parse(json);

    } catch (err) {

      console.error("JSON parse error:", err);
      console.error("AI RESPONSE:", cleaned);

      throw new Error("AI returned invalid JSON");

    }


    if (!parsed.stages || !Array.isArray(parsed.stages)) {
      throw new Error("Invalid journey structure");
    }

    const safeData: JourneyData = {
      stages: parsed.stages.map((stage) => ({
        stage: stage.stage || "Stage",
        user_actions: stage.user_actions || [],
        user_thoughts: stage.user_thoughts || [],
        pain_points: stage.pain_points || [],
        opportunities: stage.opportunities || []
      }))
    };



    const { error: dbError } = await supabase
      .from("project_journey_maps")
      .upsert(
        {
          project_id: projectId,
          persona_id: personaId,
          journey_data: safeData
        },
        { onConflict: "project_id,persona_id" }
      );

    if (dbError) {

      console.error("Supabase Error:", dbError);

      throw new Error(dbError.message);

    }



    await supabase
      .from("project_ai_chats")
      .insert([
        {
          project_id: projectId,
          module: "journey",
          role: "assistant",
          message: JSON.stringify(safeData)
        }
      ]);



    return NextResponse.json({
      success: true,
      data: safeData
    });

  } catch (error) {

    console.error("Journey Error:", error);

    return NextResponse.json(
      { success: false, error: "Journey generation failed" },
      { status: 500 }
    );
  }
}