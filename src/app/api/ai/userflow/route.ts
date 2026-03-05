import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

type FlowNode = {
  id: string;
  label: string;
};

type FlowEdge = {
  from: string;
  to: string;
};

type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export async function POST(req: Request) {
  try {

    /* ========================= */
    /* Get request body          */
    /* ========================= */

    const body = await req.json();
    const projectId = body.projectId;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    /* ========================= */
    /* Supabase client           */
    /* ========================= */

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    /* ========================= */
    /* Fetch project info        */
    /* ========================= */

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Project fetch error:", projectError);
      throw projectError;
    }

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    /* ========================= */
    /* AI Prompt                 */
    /* ========================= */

    const prompt = `
Generate a simple product user flow.

Return ONLY valid JSON.

Example format:

{
 "nodes":[
   { "id":"start","label":"User opens app"},
   { "id":"signup","label":"User signs up"}
 ],
 "edges":[
   { "from":"start","to":"signup"}
 ]
}

Project Info:
Name: ${project.name || ""}
Description: ${project.description || ""}
Target Users: ${project.target_users || ""}
Goal: ${project.goal || ""}
`;

    /* ========================= */
    /* AI Generation             */
    /* ========================= */

    const aiTextRaw = await aiChat([
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt }
    ]);

    console.log("AI RAW RESPONSE:", aiTextRaw);

    /* ========================= */
    /* Clean AI response         */
    /* ========================= */

    const cleaned = aiTextRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");

    if (first === -1 || last === -1) {
      throw new Error("AI did not return valid JSON");
    }

    const json = cleaned.slice(first, last + 1);

    let parsed: FlowData;

    try {
  parsed = JSON.parse(json);
} catch {
  console.error("JSON Parse Error:", json);
  throw new Error("AI returned invalid JSON");
}

    /* ========================= */
    /* Save flow to database     */
    /* ========================= */

    const { error: dbError } = await supabase
      .from("project_user_flows")
      .upsert(
        {
          project_id: projectId,
          flow_data: parsed
        },
        { onConflict: "project_id" }
      );

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    /* ========================= */
    /* Save AI chat log          */
    /* ========================= */

    await supabase.from("project_ai_chats").insert({
      project_id: projectId,
      module: "userflow",
      role: "assistant",
      message: JSON.stringify(parsed)
    });

    /* ========================= */
    /* Return response           */
    /* ========================= */

    return NextResponse.json({
      success: true,
      data: parsed
    });

  } catch (error: unknown) {

    console.error("User Flow Generation Error:", error);

    const message =
      error instanceof Error ? error.message : "Flow generation failed";

    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    );
  }
}