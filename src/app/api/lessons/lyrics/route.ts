import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseStoredAnalysis } from "@/lib/lyrics/saved-lessons";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecte" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, generated_at, target_cefr_level")
    .eq("user_id", user.id)
    .eq("type", "lyrics_analysis")
    .order("generated_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    lessons: (data ?? []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      generatedAt: lesson.generated_at,
      targetCefrLevel: lesson.target_cefr_level,
    })),
  });
}
