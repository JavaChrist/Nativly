import type { ClozeExercise } from "@/lib/prompts/analyze-lyrics";

export function splitClozeLines(textWithBlanks: string): string[] {
  const normalized = textWithBlanks.replace(/\r\n/g, "\n").trim();

  if (normalized.includes("\n")) {
    return normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [normalized];
}

export function countBlanksInLine(line: string): number {
  return (line.match(/\[BLANK\]/g) ?? []).length;
}

export function buildClozeFeedbackSpeech(
  exercise: ClozeExercise,
  userAnswers: Record<number, string>,
): string {
  const wrong = exercise.answers.filter((answer) => {
    const given = userAnswers[answer.blankIndex]?.trim().toLowerCase() ?? "";
    return given !== answer.word.toLowerCase();
  });

  if (wrong.length === 0) {
    return "Excellent work! You got every blank right. Let's keep going with the vocabulary.";
  }

  const corrections = wrong
    .map((answer) => {
      const number = answer.blankIndex + 1;
      const given = userAnswers[answer.blankIndex]?.trim();
      if (!given) {
        return `Blank number ${number}: the answer is "${answer.word}".`;
      }
      return `Blank number ${number}: you wrote "${given}", but the correct word is "${answer.word}".`;
    })
    .join(" ");

  return `Good try! Let me help. ${corrections} Listen carefully and try again.`;
}

export function buildVocabularySpeech(word: string, translation: string): string {
  return `Listen carefully. The word is "${word}". It means ${translation} in French. Repeat after me: ${word}.`;
}
