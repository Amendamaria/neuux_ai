import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

type OverviewPayload = {
  summary: string;
  problem_statement: string;
  ux_objectives: string;
  success_metrics: string; // stored as TEXT
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

    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const openai = new OpenAI({
      apiKey: GITHUB_TOKEN,
      baseURL: "https://models.inference.ai.azure.com",
    });

    const { projectId, feedback } = await req.json();

    if (!projectId || !feedback) {
      return NextResponse.json(
        { success: false, error: "Missing projectId or feedback" },
        { status: 400 }
      );
    }

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

    // ================= FULL GENERATION =================

    if (isFull || !existingOverview) {
      const prompt = `
Generate a complete professional UX overview.

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

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // change if needed
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a senior UX strategist. Return valid JSON only. No markdown.",
          },
          { role: "user", content: prompt },
        ],
      });

      const aiText = response.choices?.[0]?.message?.content?.trim();

      if (!aiText) {
        return NextResponse.json(
          { success: false, error: "AI returned empty response" },
          { status: 500 }
        );
      }

      let parsed: AIOverviewResponse;

      try {
        parsed = JSON.parse(aiText) as AIOverviewResponse;
      } catch (error) {
        console.error("Invalid JSON from AI:", error);
        return NextResponse.json(
          { success: false, error: "AI returned invalid JSON" },
          { status: 500 }
        );
      }

      // Convert success_metrics → TEXT (newline separated)
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
        console.error("Supabase error:", error);
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
        updatedOverview: finalOverview,
      });
    }

    // ================= PARTIAL UPDATE =================

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

Return improved text only.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a senior UX strategist. Improve the requested section only.",
        },
        { role: "user", content: prompt },
      ],
    });

    let aiText = response.choices?.[0]?.message?.content?.trim();

    if (!aiText) {
      return NextResponse.json(
        { success: false, error: "AI failed to update section" },
        { status: 500 }
      );
    }

    if (targetSection === "success_metrics") {
      try {
        const parsedArray = JSON.parse(aiText);
        if (Array.isArray(parsedArray)) {
          aiText = parsedArray.join("\n");
        }
      } catch {
        // keep as text
      }
    }

    const { error } = await supabase
      .from("project_overview")
      .update({ [targetSection]: aiText })
      .eq("project_id", projectId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      type: "partial",
      section: targetSection,
      content: aiText,
    });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}