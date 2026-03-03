import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ===============================
// 🔹 Gemini Call
// ===============================
async function generateFlow(prompt: string, apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 900,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Gemini API request failed"
    );
  }

  const parts = data?.candidates?.[0]?.content?.parts as
    | { text?: string }[]
    | undefined;

  const text =
    parts?.map((p) => p.text ?? "").join("") ?? "";

  if (!text) {
    throw new Error("Empty AI response");
  }

  return text.trim();
}

// ===============================
// 🔹 API Route
// ===============================
export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY)
      throw new Error("Missing GEMINI_API_KEY");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
      throw new Error("Missing SUPABASE_URL");

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await req.json();
    const projectId = body?.projectId;

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // 🔹 Fetch Project Details
    const { data: project, error: projectError } =
      await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    // 🔹 Mark Flow Status → pending
    await supabase
      .from("projects")
      .update({ flow_status: "pending" })
      .eq("id", projectId);

    // 🔹 Structured Prompt
    const prompt = `
You are a senior UX designer.

Create a structured User Flow using these exact headings:

ENTRY POINTS:
MAIN FLOW:
DECISION POINTS:
EDGE CASES:

Project Name: ${project.name}
Description: ${project.description}
Target Users: ${project.target_users}
Main Goal: ${project.goal}

Ensure:
- Clear step-by-step progression
- Logical decision branches
- Consider failure and edge scenarios
`;

    const aiText = await generateFlow(
      prompt,
      process.env.GEMINI_API_KEY
    );

    // 🔹 Split by headings
    const entryPoints =
      aiText.split("MAIN FLOW:")[0]
        ?.replace("ENTRY POINTS:", "")
        ?.trim() ?? "";

    const mainFlow =
      aiText.split("MAIN FLOW:")[1]
        ?.split("DECISION POINTS:")[0]
        ?.trim() ?? "";

    const decisionPoints =
      aiText.split("DECISION POINTS:")[1]
        ?.split("EDGE CASES:")[0]
        ?.trim() ?? "";

    const edgeCases =
      aiText.split("EDGE CASES:")[1]
        ?.trim() ?? "";

    if (!entryPoints || !mainFlow || !decisionPoints || !edgeCases) {
      throw new Error("AI flow structure invalid");
    }

    // 🔹 Insert / Upsert Flow
    const { error: insertError } = await supabase
      .from("project_flow")
      .upsert({
        project_id: projectId,
        entry_points: entryPoints,
        main_flow: mainFlow,
        decision_points: decisionPoints,
        edge_cases: edgeCases,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    // 🔹 Mark Flow Status → completed
    await supabase
      .from("projects")
      .update({ flow_status: "completed" })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      message: "User flow generated successfully",
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Server error";

    console.error("FLOW AI ERROR:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}