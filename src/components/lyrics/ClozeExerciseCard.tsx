"use client";

import { useMemo, useState } from "react";
import type { ClozeExercise } from "@/lib/prompts/analyze-lyrics";
import {
  buildClozeFeedbackSpeech,
  countBlanksInLine,
  splitClozeLines,
} from "@/lib/lyrics/cloze-utils";

interface ClozeExerciseCardProps {
  exercise: ClozeExercise;
  onVerified?: (feedbackSpeech: string) => void;
}

function renderLineWithBlanks(
  line: string,
  startBlankIndex: number,
  answers: Record<number, string>,
  revealed: boolean,
  exercise: ClozeExercise,
  onAnswer: (index: number, value: string) => void,
) {
  const parts = line.split(/(\[BLANK\])/);
  let blankIndex = startBlankIndex;

  return parts.map((part, partIndex) => {
    if (part !== "[BLANK]") {
      return (
        <span key={`text-${startBlankIndex}-${partIndex}`} className="text-zinc-200">
          {part}
        </span>
      );
    }

    const index = blankIndex++;
    const hint = exercise.answers.find((a) => a.blankIndex === index)?.hint;
    const value = answers[index] ?? "";
    const expected = exercise.answers.find((a) => a.blankIndex === index);
    const isCorrect =
      revealed &&
      expected &&
      value.trim().toLowerCase() === expected.word.toLowerCase();
    const isWrong = revealed && expected && !isCorrect;

    return (
      <span
        key={`blank-${index}`}
        className="mx-1 inline-flex items-baseline gap-1 align-baseline"
      >
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold text-amber-300">
          {index + 1}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onAnswer(index, e.target.value)}
          disabled={revealed}
          aria-label={`Mot manquant numero ${index + 1}`}
          placeholder="mot"
          className={`min-w-[6rem] border-b-2 bg-transparent px-1 text-center text-base outline-none transition ${
            isCorrect
              ? "border-emerald-500 text-emerald-300"
              : isWrong
                ? "border-rose-500 text-rose-300"
                : "border-amber-500/60 focus:border-amber-400"
          }`}
        />
        {hint && !revealed && (
          <span className="hidden text-xs text-zinc-600 sm:inline">
            ({hint})
          </span>
        )}
      </span>
    );
  });
}

export function ClozeExerciseCard({
  exercise,
  onVerified,
}: ClozeExerciseCardProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);

  const lines = useMemo(
    () => splitClozeLines(exercise.textWithBlanks),
    [exercise.textWithBlanks],
  );

  const totalBlanks = exercise.answers.length;
  let runningBlankIndex = 0;

  function handleVerify() {
    setRevealed(true);
    onVerified?.(buildClozeFeedbackSpeech(exercise, answers));
  }

  return (
    <section>
      <h2 className="mb-2 font-display text-2xl text-zinc-100">Texte a trous</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Completez les <strong className="text-zinc-300">{totalBlanks} mots</strong>{" "}
        numerotes dans l&apos;ordre. Chaque numero correspond a un trou dans le texte.
      </p>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <p className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-zinc-300">
          {exercise.instructions}
        </p>

        {!revealed && (
          <div className="mb-6 grid gap-2 sm:grid-cols-2">
            {exercise.answers.map((answer) => (
              <div
                key={answer.blankIndex}
                className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-zinc-500"
              >
                <span className="font-bold text-amber-400">
                  Trou {answer.blankIndex + 1}
                </span>
                {answer.hint && <span> — {answer.hint}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="mb-6 space-y-3 rounded-xl border border-white/5 bg-black/20 p-5 font-mono text-base leading-relaxed">
          {lines.map((line, lineIndex) => {
            const startIndex = runningBlankIndex;
            runningBlankIndex += countBlanksInLine(line);

            return (
              <p key={lineIndex} className="block">
                {renderLineWithBlanks(
                  line,
                  startIndex,
                  answers,
                  revealed,
                  exercise,
                  (index, value) =>
                    setAnswers((prev) => ({ ...prev, [index]: value })),
                )}
              </p>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={revealed}
          className="rounded-full bg-amber-500/20 px-5 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-60"
        >
          {revealed ? "Corrige par Mei ci-dessus" : "Verifier — Mei corrige a voix haute"}
        </button>

        {revealed && (
          <div className="mt-5 space-y-2 border-t border-white/5 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Corrigé
            </p>
            {exercise.answers.map((answer) => (
              <p key={answer.blankIndex} className="text-sm text-zinc-400">
                <span className="font-bold text-amber-400">
                  {answer.blankIndex + 1}.
                </span>{" "}
                <span className="text-zinc-200">{answer.word}</span>
                {answer.hint && (
                  <span className="text-zinc-600"> — {answer.hint}</span>
                )}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
