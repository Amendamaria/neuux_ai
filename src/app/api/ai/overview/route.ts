import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat, ChatMessage } from "@/lib/ai";

type OverviewPayload = {
  summary: string;
  problem_statement: string;
  ux_objectives: string;
  success_metrics: string;
};

/* ================= SYSTEM PROMPT ================= */

const BASE_SYSTEM_PROMPT = `
You are a UX expert assistant.

Behave like ChatGPT:
- Natural, human conversation
- Understand context from previous messages
- Continue the flow naturally
- If user says "elaborate", expand your previous answer
- Stay relevant to the conversation

Avoid:
- JSON
- structured outputs
- robotic tone

Be clear, helpful, and conversational.
`;

/* ================= CLEAN RESPONSE ================= */

function cleanResponse(text: string): string {
  if (!text) return "";

  const noJson = text.replace(/\{[\s\S]*?\}/g, "");

  const cleaned = noJson
    .replace(/"field":.*?,?/gi, "")
    .replace(/"new_value":.*?/gi, "")
    .replace(/[\{\}\[\]"]/g, "");

  return cleaned.trim();
}

/* ================= MAIN ================= */

export async function POST(req: Request) {
  try {
    const {
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing env variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("projectId" in body) ||
      !("messages" in body)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const { projectId, messages } = body as {
      projectId: string;
      messages: ChatMessage[];
    };

    if (!projectId || !messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const latestMessage =
      messages[messages.length - 1]?.content?.toLowerCase() || "";

    /* ================= FETCH ================= */

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    const { data: overview } = await supabase
      .from("project_overview")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    /* ================= INTENT (KEEP EXISTING FEATURE) ================= */

    const isUpdate =
      /(modify|update|improve|change|edit|rewrite)/.test(latestMessage);

    const isFull =
      /(full|entire|complete|regenerate)/.test(latestMessage);

    let targetSection: keyof OverviewPayload | null = null;

    if (latestMessage.includes("success"))
      targetSection = "success_metrics";
    else if (latestMessage.includes("summary"))
      targetSection = "summary";
    else if (latestMessage.includes("problem"))
      targetSection = "problem_statement";
    else if (latestMessage.includes("objective"))
      targetSection = "ux_objectives";

    /* ================= FULL GENERATION ================= */

    if (isFull || !overview) {
      const aiText = await aiChat([
        { role: "system", content: BASE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `
Create a UX project overview:

Project: ${project.name}
Description: ${project.description}
Users: ${project.target_users}
Goal: ${project.goal}

Write it like a case study. No JSON.
`,
        },
      ]);

      const clean = cleanResponse(aiText);

      await supabase.from("project_overview").upsert({
        project_id: projectId,
        summary: clean,
      });

      return NextResponse.json({
        success: true,
        type: "full",
        content: clean,
      });
    }

    /* ================= UPDATE SECTION ================= */

    if (isUpdate && targetSection && overview) {
      const aiText = await aiChat([
        { role: "system", content: BASE_SYSTEM_PROMPT },
        ...messages.slice(-10),
      ]);

      const clean = cleanResponse(aiText);

      await supabase
        .from("project_overview")
        .update({ [targetSection]: clean })
        .eq("project_id", projectId);

      return NextResponse.json({
        success: true,
        type: "update",
        content: clean,
      });
    }

    /* ================= CHAT (FIXED FLOW) ================= */

    const chatMessages: ChatMessage[] = [
      {
        role: "system",
        content: BASE_SYSTEM_PROMPT,
      },
      {
        role: "system",
        content: `
Project context:

Name: ${project.name}
Description: ${project.description}
Users: ${project.target_users}
Goal: ${project.goal}

${
  overview
    ? `Existing overview:
${overview.summary}`
    : ""
}
`,
      },

      // 🔥 THIS is the key — full conversation
      ...messages.slice(-20),
    ];

    const aiText = await aiChat(chatMessages);

    const clean = cleanResponse(aiText);

    return NextResponse.json({
      success: true,
      type: "chat",
      content: clean,
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Overview API Error:", message);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}