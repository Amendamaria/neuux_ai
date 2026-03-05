import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

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

  const { data, error } = await supabase
    .from("project_personas")
    .select("id,name")
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Failed to load personas" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data
  });

}