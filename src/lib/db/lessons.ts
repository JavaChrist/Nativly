import type { CefrLevel } from "@/lib/types/cefr";
import type { LyricsAnalysisResult } from "@/lib/prompts/analyze-lyrics";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SM2_INITIAL_EASE, SM2_INITIAL_INTERVAL } from "@/lib/sm2/review";

export interface SaveLessonInput {
  userId: string;
  lyrics: string;
  analysis: LyricsAnalysisResult;
  musicGenre?: string;
  favoriteArtist?: string;
}

function buildLessonTitle(lyrics: string): string {
  const firstLine = lyrics
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);

  if (!firstLine) return "Paroles - analyse";
  const snippet =
    firstLine.length > 40 ? `${firstLine.slice(0, 40)}...` : firstLine;
  return `Paroles - ${snippet}`;
}

/** Persiste une lecon et son vocabulaire avec planification SM-2 initiale */
export async function saveLyricsLesson(
  supabase: SupabaseClient,
  input: SaveLessonInput,
): Promise<{ lessonId: string; vocabularyCount: number }> {
  const { data: theme, error: themeError } = await supabase
    .from("themes")
    .select("id")
    .eq("slug", "music")
    .single();

  if (themeError || !theme) {
    throw new Error("Theme musique introuvable");
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .insert({
      user_id: input.userId,
      theme_id: theme.id,
      title: buildLessonTitle(input.lyrics),
      source_content: input.lyrics,
      generated_content_json: input.analysis,
      type: "lyrics_analysis",
      target_cefr_level: input.analysis.overallDifficulty,
    })
    .select("id")
    .single();

  if (lessonError || !lesson) {
    throw new Error(lessonError?.message ?? "Echec sauvegarde lecon");
  }

  const today = new Date().toISOString().split("T")[0];
  let vocabularyCount = 0;

  for (const item of input.analysis.vocabulary) {
    const { data: vocab, error: vocabError } = await supabase
      .from("vocabulary_items")
      .insert({
        user_id: input.userId,
        word: item.word,
        translation: item.translation,
        context_sentence: item.contextSentence,
        difficulty: item.difficulty,
        lesson_id: lesson.id,
      })
      .select("id")
      .single();

    if (vocabError || !vocab) continue;

    await supabase.from("review_schedule").insert({
      user_id: input.userId,
      vocabulary_item_id: vocab.id,
      next_review_date: today,
      ease_factor: SM2_INITIAL_EASE,
      interval_days: SM2_INITIAL_INTERVAL,
      repetition_count: 0,
    });

    vocabularyCount++;
  }

  if (input.musicGenre || input.favoriteArtist) {
    const { data: profile } = await supabase
      .from("user_profile")
      .select("interests_json")
      .eq("user_id", input.userId)
      .single();

    const current = (profile?.interests_json as Record<string, string>) ?? {};

    await supabase
      .from("user_profile")
      .update({
        interests_json: {
          ...current,
          ...(input.musicGenre ? { musicGenre: input.musicGenre } : {}),
          ...(input.favoriteArtist
            ? { favoriteArtist: input.favoriteArtist }
            : {}),
        },
      })
      .eq("user_id", input.userId);
  }

  return { lessonId: lesson.id, vocabularyCount };
}

export async function getProfileLevels(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ written: CefrLevel; spoken: CefrLevel }> {
  const { data } = await supabase
    .from("user_profile")
    .select("written_cefr_level, spoken_fluency_cefr_level")
    .eq("user_id", userId)
    .single();

  return {
    written: (data?.written_cefr_level as CefrLevel) ?? "A2",
    spoken: (data?.spoken_fluency_cefr_level as CefrLevel) ?? "A2",
  };
}
