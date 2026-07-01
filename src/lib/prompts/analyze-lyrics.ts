import { z } from "zod";
import type { CefrLevel } from "@/lib/types/cefr";

/** Mot ou expression clé extrait des paroles */
export const vocabularyItemSchema = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  contextSentence: z.string().min(1),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  partOfSpeech: z.string().optional(),
});

/** Expression idiomatique ou tournure non littérale */
export const idiomSchema = z.object({
  expression: z.string().min(1),
  literalMeaning: z.string().min(1),
  actualMeaning: z.string().min(1),
  explanation: z.string().min(1),
  exampleInContext: z.string().min(1),
});

/** Exercice texte à trous */
export const clozeExerciseSchema = z.object({
  instructions: z.string().min(1),
  /** Texte avec [BLANK] pour chaque mot masqué */
  textWithBlanks: z.string().min(1),
  answers: z.array(
    z.object({
      blankIndex: z.number().int().nonnegative(),
      word: z.string().min(1),
      hint: z.string().optional(),
    }),
  ),
});

/** Question de compréhension */
export const comprehensionQuestionSchema = z.object({
  question: z.string().min(1),
  type: z.enum(["comprehension", "reflection", "vocabulary"]),
  suggestedAnswer: z.string().min(1),
  /** Points clés attendus dans la réponse (pour auto-évaluation) */
  keyPoints: z.array(z.string()).min(1),
});

/** Schéma complet de sortie de l'analyse de paroles */
export const lyricsAnalysisSchema = z.object({
  summary: z.string().min(1),
  coachSpeechEn: z.string().min(1),
  overallDifficulty: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  vocabulary: z.array(vocabularyItemSchema).min(3).max(20),
  idioms: z.array(idiomSchema).max(10),
  clozeExercise: clozeExerciseSchema,
  comprehensionQuestions: z
    .array(comprehensionQuestionSchema)
    .min(3)
    .max(5),
  culturalNotes: z.array(z.string()).max(5).optional(),
});

export type VocabularyItem = z.infer<typeof vocabularyItemSchema>;
export type IdiomItem = z.infer<typeof idiomSchema>;
export type ClozeExercise = z.infer<typeof clozeExerciseSchema>;
export type ComprehensionQuestion = z.infer<typeof comprehensionQuestionSchema>;
export type LyricsAnalysisResult = z.infer<typeof lyricsAnalysisSchema>;

export interface AnalyzeLyricsInput {
  lyrics: string;
  writtenLevel: CefrLevel;
  spokenLevel: CefrLevel;
  musicGenre?: string;
  favoriteArtist?: string;
}

export interface AnalyzeLyricsPromptPayload {
  system: string;
  user: string;
}

const CEFR_GUIDANCE: Record<CefrLevel, string> = {
  A1:
    "Use very simple vocabulary in explanations (French). Focus on high-frequency words only.",
  A2:
    "Use simple explanations. Highlight basic collocations and common phrases.",
  B1:
    "Include intermediate expressions and explain subtle meaning shifts.",
  B2:
    "Cover nuanced vocabulary, register shifts, and figurative language.",
  C1:
    "Include advanced idioms, cultural subtext, and stylistic choices.",
};

export function buildAnalyzeLyricsPrompt(
  input: AnalyzeLyricsInput,
): AnalyzeLyricsPromptPayload {
  const personalization = [
    input.musicGenre ? `Preferred genre: ${input.musicGenre}` : null,
    input.favoriteArtist ? `Favorite artist: ${input.favoriteArtist}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const system = `You are an expert English teacher specializing in music-based language learning.
Your task is to analyze song lyrics for a French-speaking learner and produce structured pedagogical content.

CRITICAL RULES:
- Respond ONLY with valid JSON matching the exact schema described. No markdown, no preamble.
- Explanations and translations must be in French.
- Never reproduce the full lyrics in your output — only short context snippets (max 15 words each).
- Adapt difficulty to the learner profile below.
- Extract vocabulary that is emotionally and contextually meaningful, not random rare words.
- For cloze exercise: replace 6-10 key vocabulary words with [BLANK] markers in order.
- Comprehension questions: mix comprehension, reflection, and vocabulary (3-5 total).

Learner profile:
- Written CEFR level: ${input.writtenLevel} — ${CEFR_GUIDANCE[input.writtenLevel]}
- Spoken fluency CEFR level: ${input.spokenLevel}
${personalization ? `\nPersonalization:\n${personalization}` : ""}

JSON schema (strict):
{
  "summary": "string — 2-3 sentences in French about the song's themes and language level",
  "coachSpeechEn": "string — 2-4 warm sentences in ENGLISH spoken by Mei introducing the lesson (mention 2-3 key vocabulary words)",
  "overallDifficulty": "A1|A2|B1|B2|C1",
  "vocabulary": [{
    "word": "string",
    "translation": "string (French)",
    "contextSentence": "string — short excerpt from lyrics, max 15 words",
    "difficulty": "A1|A2|B1|B2|C1",
    "partOfSpeech": "string optional"
  }],
  "idioms": [{
    "expression": "string",
    "literalMeaning": "string (French)",
    "actualMeaning": "string (French)",
    "explanation": "string (French)",
    "exampleInContext": "string — short excerpt"
  }],
  "clozeExercise": {
    "instructions": "string (French)",
    "textWithBlanks": "string — lyrics excerpt with [BLANK] markers",
    "answers": [{ "blankIndex": 0, "word": "string", "hint": "string optional (French)" }]
  },
  "comprehensionQuestions": [{
    "question": "string (French)",
    "type": "comprehension|reflection|vocabulary",
    "suggestedAnswer": "string (French)",
    "keyPoints": ["string"]
  }],
  "culturalNotes": ["string optional (French)"]
}`;

  const user = `Analyze the following song lyrics for English learning:

---
${input.lyrics.trim()}
---

Generate the JSON pedagogical content now.`;

  return { system, user };
}

export function parseLyricsAnalysis(raw: unknown): LyricsAnalysisResult {
  return lyricsAnalysisSchema.parse(raw);
}
