import type { LyricsAnalysisResult } from "@/lib/prompts/analyze-lyrics";
import { parseLyricsAnalysis } from "@/lib/prompts/analyze-lyrics";

export interface SavedLyricsLessonSummary {
  id: string;
  title: string;
  generatedAt: string;
  targetCefrLevel: string;
}

export interface SavedLyricsLessonDetail extends SavedLyricsLessonSummary {
  sourceContent: string;
  analysis: LyricsAnalysisResult | null;
}

export function parseStoredAnalysis(
  raw: unknown,
): LyricsAnalysisResult | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const withCoach = {
    ...record,
    coachSpeechEn:
      typeof record.coachSpeechEn === "string" && record.coachSpeechEn.length > 0
        ? record.coachSpeechEn
        : "Hi! I'm Mei. Let's review this song together and practice the vocabulary.",
  };

  try {
    return parseLyricsAnalysis(withCoach);
  } catch {
    return null;
  }
}
