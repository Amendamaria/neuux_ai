import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

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

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId" },
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

    // Fetch project
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

Return ONLY valid JSON array in this exact format:

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

Project:
Name: ${project.name}
Description: ${project.description}
Target Users: ${project.target_users}
Goal: ${project.goal}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a senior UX strategist. Return valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
    });

    let aiText = response.choices?.[0]?.message?.content?.trim();

    if (!aiText) {
      return NextResponse.json(
        { success: false, error: "AI returned empty response" },
        { status: 500 }
      );
    }

    // Clean AI response
    aiText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const firstBracket = aiText.indexOf("[");
    const lastBracket = aiText.lastIndexOf("]");

    if (firstBracket === -1 || lastBracket === -1) {
      return NextResponse.json(
        { success: false, error: "AI returned invalid format" },
        { status: 500 }
      );
    }

    const cleanJson = aiText.slice(firstBracket, lastBracket + 1);

    let parsed: PersonaPayload[];

    try {
      parsed = JSON.parse(cleanJson);
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      return NextResponse.json(
        { success: false, error: "AI returned invalid JSON" },
        { status: 500 }
      );
    }

    // Delete old personas
    await supabase
      .from("project_personas")
      .delete()
      .eq("project_id", projectId);

    const insertData = parsed.map((p) => ({
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

    const { error: insertError } = await supabase
      .from("project_personas")
      .insert(insertData);

    if (insertError) {
      return NextResponse.json(
        { success: false, error: "Database insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}