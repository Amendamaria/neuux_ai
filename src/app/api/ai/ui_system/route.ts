import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ===============================
// 🔹 Gemini Call
// ===============================
async function generateUISystem(prompt: string, apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1000,
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

    // 🔹 Mark UI Status → pending
    await supabase
      .from("projects")
      .update({ ui_status: "pending" })
      .eq("id", projectId);

    // 🔹 Structured Prompt
    const prompt = `
You are a senior UI/UX designer.

Create a structured UI Design System using these exact headings:

COLOR PALETTE:
TYPOGRAPHY:
COMPONENTS:
LAYOUT PRINCIPLES:

Project Name: ${project.name}
Description: ${project.description}
Target Users: ${project.target_users}
Main Goal: ${project.goal}

Ensure:
- Color palette includes primary, secondary, accent, neutral
- Typography includes heading and body system
- Components include buttons, inputs, cards, navigation
- Layout principles mention spacing, grid, hierarchy
`;

    const aiText = await generateUISystem(
      prompt,
      process.env.GEMINI_API_KEY
    );

    // 🔹 Split by headings
    const colorPalette =
      aiText.split("TYPOGRAPHY:")[0]
        ?.replace("COLOR PALETTE:", "")
        ?.trim() ?? "";

    const typography =
      aiText.split("TYPOGRAPHY:")[1]
        ?.split("COMPONENTS:")[0]
        ?.trim() ?? "";

    const components =
      aiText.split("COMPONENTS:")[1]
        ?.split("LAYOUT PRINCIPLES:")[0]
        ?.trim() ?? "";

    const layout =
      aiText.split("LAYOUT PRINCIPLES:")[1]
        ?.trim() ?? "";

    if (!colorPalette || !typography || !components || !layout) {
      throw new Error("AI UI system structure invalid");
    }

    // 🔹 Insert / Upsert UI System
    const { error: insertError } = await supabase
      .from("project_ui_system")
      .upsert({
        project_id: projectId,
        color_palette: colorPalette,
        typography: typography,
        components: components,
        layout_principles: layout,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    // 🔹 Mark UI Status → completed
    await supabase
      .from("projects")
      .update({ ui_status: "completed" })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      message: "UI system generated successfully",
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Server error";

    console.error("UI SYSTEM AI ERROR:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}