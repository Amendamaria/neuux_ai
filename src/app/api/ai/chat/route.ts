import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

// ================= PARSER =================

function parseOverview(text: string) {
  const cleaned = text.replace(/\*\*/g, "").trim();

  const sections = {
    summary: "",
    problem_statement: "",
    ux_objectives: "",
    success_metrics: "",
  };

  const lines = cleaned.split("\n");

  let current: keyof typeof sections | null = null;

  for (const line of lines) {
    const l = line.toLowerCase().trim();

    if (l.startsWith("summary")) {
      current = "summary";
      continue;
    }
    if (l.startsWith("problem statement")) {
      current = "problem_statement";
      continue;
    }
    if (l.startsWith("ux objectives")) {
      current = "ux_objectives";
      continue;
    }
    if (l.startsWith("success metrics")) {
      current = "success_metrics";
      continue;
    }

    if (current) {
      sections[current] += line + "\n";
    }
  }

  return {
    summary: sections.summary.trim(),
    problem_statement: sections.problem_statement.trim(),
    ux_objectives: sections.ux_objectives.trim(),
    success_metrics: sections.success_metrics.trim(),
  };
}

// ================= API =================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, messages } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
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

    // ================= CONTEXT =================

    const context = `
You are a UX expert.

Project:
Name: ${project.name}
Description: ${project.description}
Users: ${project.target_users}
Goal: ${project.goal}

IMPORTANT:
- ONLY talk about this project
- DO NOT assume other domains
`;

    // ================= CHECK: FIRST MESSAGE → GENERATE OVERVIEW =================

    const isFirstGeneration = !messages || messages.length === 0;

    if (isFirstGeneration) {
      const aiText = await aiChat([
        { role: "system", content: context },
        {
          role: "user",
          content: `
Generate a UX project overview:

Summary:
...

Problem Statement:
...

UX Objectives:
...

Success Metrics:
...
`,
        },
      ]);

      const parsed = parseOverview(aiText || "");

      await supabase.from("project_overview").upsert({
        project_id: projectId,
        ...parsed,
      });

      return NextResponse.json({
        success: true,
        content: aiText,
      });
    }

    // ================= CHAT MODE =================

    const aiText = await aiChat([
      { role: "system", content: context },
      ...messages.slice(-5),
    ]);

    return NextResponse.json({
      success: true,
      content: aiText,
    });

  } catch (error) {
    console.error("AI Error:", error);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}