import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aiChat } from "@/lib/ai";

type DesignSystem = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    font_family: string;
    headings: string;
    body: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  components: string[];
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
Generate a modern UI design system.

Return ONLY JSON:

{
 "colors":{
   "primary":"",
   "secondary":"",
   "background":"",
   "surface":"",
   "text":""
 },
 "typography":{
   "font_family":"",
   "headings":"",
   "body":""
 },
 "spacing":{
   "xs":"",
   "sm":"",
   "md":"",
   "lg":"",
   "xl":""
 },
 "components":[]
}

Project:
Name: ${project.name}
Description: ${project.description}
Target Users: ${project.target_users}
Goal: ${project.goal}
`;

    const aiTextRaw = await aiChat([
      { role: "system", content: "Return JSON only." },
      { role: "user", content: prompt }
    ]);

    const cleaned = aiTextRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed: DesignSystem = JSON.parse(cleaned);

    await supabase
      .from("project_design_systems")
      .upsert(
        {
          project_id: projectId,
          design_system: parsed
        },
        { onConflict: "project_id" }
      );

    return NextResponse.json({
      success: true,
      data: parsed
    });

  } catch (error) {

    console.error("Design system error:", error);

    return NextResponse.json(
      { success: false, error: "Design system generation failed" },
      { status: 500 }
    );
  }
}