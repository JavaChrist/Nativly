"use client";

import { useState } from "react";
import type { ClozeExercise } from "@/lib/prompts/analyze-lyrics";

interface ClozeExerciseCardProps {
  exercise: ClozeExercise;
}

export function ClozeExerciseCard({ exercise }: ClozeExerciseCardProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);

  const parts = exercise.textWithBlanks.split(/(\[BLANK\])/);
  let blankCounter = 0;

  const isCorrect = (index: number, value: string) => {
    const expected = exercise.answers.find((a) => a.blankIndex === index);
    if (!expected) return false;
    return value.trim().toLowerCase() === expected.word.toLowerCase();
  };

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-zinc-100">
        Texte à trous
      </h2>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <p className="mb-6 text-sm text-zinc-400">{exercise.instructions}</p>

        <div className="mb-6 flex flex-wrap gap-x-1 gap-y-3 text-lg leading-loose text-zinc-200">
          {parts.map((part, i) => {
            if (part !== "[BLANK]") {
              return (
                <span key={`text-${i}`} className="whitespace-pre-wrap">
                  {part}
                </span>
              );
            }

            const index = blankCounter++;
            const hint = exercise.answers.find((a) => a.blankIndex === index)
              ?.hint;

            return (
              <span key={`blank-${index}`} className="inline-flex flex-col">
                <input
                  type="text"
                  value={answers[index] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [index]: e.target.value }))
                  }
                  disabled={revealed}
                  placeholder="..."
                  title={hint}
                  className={`mx-1 min-w-[7rem] border-b-2 bg-transparent px-1 text-center outline-none transition ${
                    revealed
                      ? isCorrect(index, answers[index] ?? "")
                        ? "border-emerald-500 text-emerald-300"
                        : "border-rose-500 text-rose-300"
                      : "border-amber-500/50 focus:border-amber-400"
                  }`}
                />
              </span>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-full bg-amber-500/20 px-5 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30"
        >
          {revealed ? "Réponses affichées" : "Vérifier"}
        </button>

        {revealed && (
          <div className="mt-4 space-y-1 text-sm text-zinc-500">
            {exercise.answers.map((a) => (
              <p key={a.blankIndex}>
                Trou {a.blankIndex + 1} :{" "}
                <span className="text-zinc-300">{a.word}</span>
                {a.hint && (
                  <span className="text-zinc-600"> — {a.hint}</span>
                )}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
