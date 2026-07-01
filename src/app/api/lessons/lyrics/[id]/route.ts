import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseStoredAnalysis } from "@/lib/lyrics/saved-lessons";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecte" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, title, source_content, generated_content_json, generated_at, target_cefr_level",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("type", "lyrics_analysis")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Lecon introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    lesson: {
      id: data.id,
      title: data.title,
      generatedAt: data.generated_at,
      targetCefrLevel: data.target_cefr_level,
      sourceContent: data.source_content,
      analysis: parseStoredAnalysis(data.generated_content_json),
    },
  });
}
