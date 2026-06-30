import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeWrittenLevel } from "@/lib/placement/written-questions";

const bodySchema = z.object({
  musicGenre: z.string().min(1),
  favoriteArtist: z.string().min(1),
  writtenAnswers: z.array(
    z.object({
      questionId: z.string(),
      selectedIndex: z.number().int().nonnegative(),
    }),
  ),
  oralResponses: z.array(z.string()).min(1).max(3),
  spokenLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  oralSummary: z.string().optional(),
});

function formatTitle(prefix: string, level: string): string {
  const date = new Date().toLocaleDateString("fr-FR");
  return `${prefix} - ${level} - ${date}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Donnees invalides" },
        { status: 400 },
      );
    }

    const {
      musicGenre,
      favoriteArtist,
      writtenAnswers,
      oralResponses,
      spokenLevel,
      oralSummary,
    } = parsed.data;

    const writtenResult = computeWrittenLevel(writtenAnswers);
    const now = new Date().toISOString();

    await supabase.from("placement_test_results").insert([
      {
        user_id: user.id,
        title: formatTitle("Test ecrit", writtenResult.level),
        test_type: "written",
        resulting_cefr_level: writtenResult.level,
        score_detail_json: {
          answers: writtenAnswers,
          score: writtenResult.score,
          total: writtenResult.total,
        },
        taken_at: now,
      },
      {
        user_id: user.id,
        title: formatTitle("Test oral", spokenLevel),
        test_type: "oral",
        resulting_cefr_level: spokenLevel,
        score_detail_json: {
          responses: oralResponses,
          summary: oralSummary ?? null,
        },
        taken_at: now,
      },
    ]);

    const { error: profileError } = await supabase
      .from("user_profile")
      .update({
        written_cefr_level: writtenResult.level,
        spoken_fluency_cefr_level: spokenLevel,
        last_calibrated_at: now,
        onboarding_completed: true,
        interests_json: {
          theme: "music",
          musicGenre,
          favoriteArtist,
        },
      })
      .eq("user_id", user.id);

    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({
      writtenLevel: writtenResult.level,
      spokenLevel,
    });
  } catch (error) {
    console.error("[onboarding/complete]", error);
    return NextResponse.json(
      { error: "Echec enregistrement onboarding" },
      { status: 500 },
    );
  }
}
