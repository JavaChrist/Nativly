import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeForJson } from "@/lib/ai/claude";
import {
  buildAnalyzeLyricsPrompt,
  parseLyricsAnalysis,
  type LyricsAnalysisResult,
} from "@/lib/prompts/analyze-lyrics";
import { hasAnthropicKey } from "@/config/env.server";
import { DEFAULT_CEFR_PROFILE } from "@/lib/types/cefr";
import { createClient } from "@/lib/supabase/server";
import { getProfileLevels, saveLyricsLesson } from "@/lib/db/lessons";

const requestSchema = z.object({
  lyrics: z.string().min(20, "Collez au moins quelques lignes de paroles"),
  writtenLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
  spokenLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
  musicGenre: z.string().optional(),
  favoriteArtist: z.string().optional(),
});

export type AnalyzeLyricsResponse = {
  analysis: LyricsAnalysisResult;
  saved?: { lessonId: string; vocabularyCount: number };
  debug?: {
    system: string;
    user: string;
    rawResponse: string;
  };
};

/** Données de démo quand la clé API n'est pas configurée */
function getDemoAnalysis(): LyricsAnalysisResult {
  return {
    summary:
      "Mode démo — configurez ANTHROPIC_API_KEY pour une analyse réelle. Ce texte illustre la structure des résultats.",
    coachSpeechEn:
      "Hi! I'm Mei, your music English coach. This demo shows how I'll introduce your lesson. Add your Anthropic key for a real analysis — we'll explore vocabulary like wonder, heartbreak, and hold on together!",
    overallDifficulty: "B1",
    vocabulary: [
      {
        word: "wonder",
        translation: "se demander, s'étonner",
        contextSentence: "I wonder how long it will take",
        difficulty: "A2",
        partOfSpeech: "verb",
      },
      {
        word: "heartbreak",
        translation: "chagrin d'amour",
        contextSentence: "Another heartbreak coming my way",
        difficulty: "B1",
        partOfSpeech: "noun",
      },
      {
        word: "hold on",
        translation: "tenir bon, patienter",
        contextSentence: "Just hold on a little longer",
        difficulty: "B1",
        partOfSpeech: "phrasal verb",
      },
    ],
    idioms: [
      {
        expression: "hold on",
        literalMeaning: "tenir fermement",
        actualMeaning: "patienter, attendre un peu",
        explanation:
          "Expression courante pour demander à quelqu'un d'attendre ou encourager la patience.",
        exampleInContext: "Just hold on a little longer",
      },
    ],
    clozeExercise: {
      instructions:
        "Completez les 6 mots numerotes (1 a 6) dans l'ordre, un mot par trou.",
      textWithBlanks:
        "When I find myself in times of [BLANK]\nSpeaking words of [BLANK], let it be\nAnd in my hour of [BLANK] she is standing\nLet it be, let it be, whisper words of [BLANK]\nAnd when the night is [BLANK], there is still a [BLANK]",
      answers: [
        { blankIndex: 0, word: "trouble", hint: "Difficulte, probleme" },
        { blankIndex: 1, word: "wisdom", hint: "Sagesse" },
        { blankIndex: 2, word: "darkness", hint: "Obscurite" },
        { blankIndex: 3, word: "wisdom", hint: "Sagesse (encore)" },
        { blankIndex: 4, word: "cloudy", hint: "Nuageux" },
        { blankIndex: 5, word: "light", hint: "Lumiere" },
      ],
    },
    comprehensionQuestions: [
      {
        question: "Quel sentiment principal transmet ce passage ?",
        type: "comprehension",
        suggestedAnswer:
          "Un mélange d'incertitude et de résilience face à une peine amoureuse.",
        keyPoints: ["incertitude", "résilience", "peine amoureuse"],
      },
      {
        question: "Pourquoi l'auteur utilise-t-il « hold on » plutôt que « wait » ?",
        type: "reflection",
        suggestedAnswer:
          "« Hold on » est plus émotionnel et implique de tenir bon dans une épreuve, pas seulement attendre.",
        keyPoints: ["connotation émotionnelle", "résilience"],
      },
      {
        question: "Que signifie « heartbreak » au sens figuré ?",
        type: "vocabulary",
        suggestedAnswer:
          "Une douleur émotionnelle causée par une rupture ou un chagrin amoureux.",
        keyPoints: ["métaphore", "douleur émotionnelle"],
      },
    ],
    culturalNotes: [
      "Les chansons pop anglaises utilisent souvent des métaphores du cœur pour parler d'amour.",
    ],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
        { status: 400 },
      );
    }

    const {
      lyrics,
      musicGenre,
      favoriteArtist,
    } = parsed.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const profileLevels = user
      ? await getProfileLevels(supabase, user.id)
      : DEFAULT_CEFR_PROFILE;

    const writtenLevel = parsed.data.writtenLevel ?? profileLevels.written;
    const spokenLevel = parsed.data.spokenLevel ?? profileLevels.spoken;

    if (!hasAnthropicKey()) {
      return NextResponse.json({
        analysis: getDemoAnalysis(),
        demo: true,
      } satisfies AnalyzeLyricsResponse & { demo: boolean });
    }

    const prompt = buildAnalyzeLyricsPrompt({
      lyrics,
      writtenLevel,
      spokenLevel,
      musicGenre,
      favoriteArtist,
    });

    const result = await callClaudeForJson(prompt, parseLyricsAnalysis);

    let saved: { lessonId: string; vocabularyCount: number } | undefined;

    if (user) {
      try {
        saved = await saveLyricsLesson(supabase, {
          userId: user.id,
          lyrics,
          analysis: result.data,
          musicGenre,
          favoriteArtist,
        });
      } catch (saveError) {
        console.error("[analyze-lyrics] save failed", saveError);
      }
    }

    return NextResponse.json({
      analysis: result.data,
      saved,
      debug: result.debug,
    } satisfies AnalyzeLyricsResponse);
  } catch (error) {
    console.error("[analyze-lyrics]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'analyse des paroles",
      },
      { status: 500 },
    );
  }
}
