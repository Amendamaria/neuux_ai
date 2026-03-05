import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

type OverviewPayload = {
  summary: string;
  problem_statement: string;
  ux_objectives: string;
  success_metrics: string;
};

type AIOverviewResponse = {
  summary: string;
  problem_statement: string;
  ux_objectives: string;
  success_metrics: string[] | string;
};

export async function POST(req: Request) {
  try {
    const {
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { projectId, feedback } = await req.json();

    if (!projectId || !feedback) {
      return NextResponse.json(
        { success: false, error: "Missing projectId or feedback" },
        { status: 400 }
      );
    }

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

    const { data: existingOverview } = await supabase
      .from("project_overview")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    const lower = feedback.toLowerCase();

    const isFull =
      lower.includes("full") ||
      lower.includes("entire") ||
      lower.includes("complete") ||
      lower.includes("regenerate");

    /* ================================================= */
    /*                FULL GENERATION                    */
    /* ================================================= */

    if (isFull || !existingOverview) {
      const prompt = `
Generate a professional UX project overview.

Return ONLY valid JSON in this format:

{
  "summary": "",
  "problem_statement": "",
  "ux_objectives": "",
  "success_metrics": []
}

Project:
Name: ${project.name}
Description: ${project.description}
Target Users: ${project.target_users}
Goal: ${project.goal}
`;

      let aiText = await aiChat([
        {
          role: "system",
          content: "You are a senior UX strategist. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ]);

      /* ================= SAFE JSON PARSE ================= */

      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

      const jsonMatch = aiText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return NextResponse.json(
          { success: false, error: "AI response parsing failed" },
          { status: 500 }
        );
      }

      const parsed = JSON.parse(jsonMatch[0]) as AIOverviewResponse;

      const successMetricsText = Array.isArray(parsed.success_metrics)
        ? parsed.success_metrics.join("\n")
        : parsed.success_metrics ?? "";

      const { error } = await supabase
        .from("project_overview")
        .upsert(
          {
            project_id: projectId,
            summary: parsed.summary,
            problem_statement: parsed.problem_statement,
            ux_objectives: parsed.ux_objectives,
            success_metrics: successMetricsText,
          },
          { onConflict: "project_id" }
        );

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      const finalOverview: OverviewPayload = {
        summary: parsed.summary,
        problem_statement: parsed.problem_statement,
        ux_objectives: parsed.ux_objectives,
        success_metrics: successMetricsText,
      };

      return NextResponse.json({
        success: true,
        type: "full",
        message: "New overview generated successfully.",
        updatedOverview: finalOverview,
      });
    }

    /* ================================================= */
    /*                PARTIAL UPDATE                     */
    /* ================================================= */

    let targetSection: keyof OverviewPayload | null = null;

    if (lower.includes("problem")) targetSection = "problem_statement";
    else if (lower.includes("objective")) targetSection = "ux_objectives";
    else if (lower.includes("metric")) targetSection = "success_metrics";
    else if (lower.includes("summary")) targetSection = "summary";

    if (!targetSection) {
      return NextResponse.json(
        { success: false, error: "Could not detect section" },
        { status: 400 }
      );
    }

    const prompt = `
Improve ONLY this section: ${targetSection}

Project:
Name: ${project.name}
Description: ${project.description}
Target Users: ${project.target_users}
Goal: ${project.goal}

User feedback: "${feedback}"

Return improved text only.
`;

    const aiText = await aiChat([
      {
        role: "system",
        content: "You are a senior UX strategist.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    let updatedText = aiText.trim();

    if (targetSection === "success_metrics") {
      try {
        const parsedArray = JSON.parse(updatedText);
        if (Array.isArray(parsedArray)) {
          updatedText = parsedArray.join("\n");
        }
      } catch {}
    }

    const { error } = await supabase
      .from("project_overview")
      .update({ [targetSection]: updatedText })
      .eq("project_id", projectId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      type: "partial",
      message: `Updated ${targetSection.replace("_", " ")}.`,
      section: targetSection,
      content: updatedText,
    });

  } catch (error) {
    console.error("Overview AI Error:", error);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}