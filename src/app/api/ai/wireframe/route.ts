import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

type Screen = {
  name: string;
  sections: string[];
};

type WireframeData = {
  screens: Screen[];
};

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    const prompt = `
Generate UX wireframe screens for the following product.

Project: ${project.name}
Description: ${project.description}

Return ONLY valid JSON:

{
  "screens": [
    {
      "name": "Screen name",
      "sections": ["section1","section2"]
    }
  ]
}
`;

    const aiTextRaw = await aiChat([
      { role: "system", content: "Return JSON only." },
      { role: "user", content: prompt }
    ]);

    const cleaned = aiTextRaw.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed: WireframeData = JSON.parse(cleaned);

    const safeData: WireframeData = {
      screens: parsed.screens.map((s) => ({
        name: s.name || "Screen",
        sections: s.sections || []
      }))
    };

    await supabase.from("project_wireframes").upsert(
      {
        project_id: projectId,
        wireframe_data: safeData
      },
      { onConflict: "project_id" }
    );

    return NextResponse.json({
      success: true,
      data: safeData
    });

  } catch (error) {
    console.error("Wireframe Error:", error);

    return NextResponse.json(
      { success: false, error: "Wireframe generation failed" },
      { status: 500 }
    );
  }
}