import type { CefrLevel } from "@/lib/types/cefr";

/** Valeurs initiales SM-2 pour une nouvelle carte */
export const SM2_INITIAL_EASE = 2.5;
export const SM2_INITIAL_INTERVAL = 1;

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewScheduleState {
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
}

/**
 * Calcule le prochain intervalle selon SM-2 simplifié.
 * quality: 0-2 = échec, 3-5 = succès (échelle subjective utilisateur)
 */
export function computeNextReview(
  current: ReviewScheduleState,
  quality: ReviewQuality,
): ReviewScheduleState {
  if (quality < 3) {
    return {
      easeFactor: Math.max(1.3, current.easeFactor - 0.2),
      intervalDays: 1,
      repetitionCount: 0,
    };
  }

  let intervalDays: number;
  if (current.repetitionCount === 0) {
    intervalDays = 1;
  } else if (current.repetitionCount === 1) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(current.intervalDays * current.easeFactor);
  }

  const easeFactor =
    current.easeFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  return {
    easeFactor: Math.max(1.3, easeFactor),
    intervalDays,
    repetitionCount: current.repetitionCount + 1,
  };
}

export function getNextReviewDate(intervalDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString().split("T")[0];
}

export interface VocabularyForReview {
  word: string;
  translation: string;
  contextSentence?: string;
  difficulty?: CefrLevel;
}
