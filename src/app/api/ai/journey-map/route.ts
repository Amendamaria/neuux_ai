import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

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

    const openai = new OpenAI({
      apiKey: GITHUB_TOKEN,
      baseURL: "https://models.inference.ai.azure.com",
    });

    /* ========================= */
    /*   Fetch Overview + Persona */
    /* ========================= */

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

    /* ========================= */
    /*         AI Prompt         */
    /* ========================= */

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

Generate a complete UX journey map.

Return STRICTLY valid JSON in this format:

{
  "stages": [
    {
      "stage": "Discovery",
      "user_actions": [],
      "user_thoughts": [],
      "pain_points": [],
      "opportunities": []
    },
    {
      "stage": "Consideration",
      "user_actions": [],
      "user_thoughts": [],
      "pain_points": [],
      "opportunities": []
    },
    {
      "stage": "Usage",
      "user_actions": [],
      "user_thoughts": [],
      "pain_points": [],
      "opportunities": []
    },
    {
      "stage": "Retention",
      "user_actions": [],
      "user_thoughts": [],
      "pain_points": [],
      "opportunities": []
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        { role: "system", content: "Return valid JSON only." },
        { role: "user", content: prompt },
      ],
    });

    let text = completion.choices?.[0]?.message?.content?.trim() || "";

    /* ========================= */
    /*     Clean AI Response     */
    /* ========================= */

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");

    if (first === -1 || last === -1) {
      throw new Error("Invalid JSON format from AI");
    }

    text = text.slice(first, last + 1);

    let parsed: JourneyData;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    /* ========================= */
    /*   Validate Structure      */
    /* ========================= */

    if (!parsed.stages || !Array.isArray(parsed.stages)) {
      throw new Error("Invalid journey structure");
    }

    const safeData: JourneyData = {
      stages: parsed.stages.map((stage) => ({
        stage: stage.stage || "Stage",
        user_actions: stage.user_actions || [],
        user_thoughts: stage.user_thoughts || [],
        pain_points: stage.pain_points || [],
        opportunities: stage.opportunities || [],
      })),
    };

    /* ========================= */
    /*      Save to Database     */
    /* ========================= */

    const { error: dbError } = await supabase
      .from("project_journey_maps")
      .upsert({
        project_id: projectId,
        persona_id: personaId,
        journey_data: safeData,
      });

    if (dbError) {
      throw new Error("Database insert failed");
    }

    /* ========================= */
    /*     Return to Frontend    */
    /* ========================= */

    return NextResponse.json({
      success: true,
      data: safeData,
    });

  } catch (error) {
    console.error("Journey Error:", error);

    return NextResponse.json(
      { success: false, error: "Journey generation failed" },
      { status: 500 }
    );
  }
}