"use client";

import { useState } from "react";
import type { ComprehensionQuestion } from "@/lib/prompts/analyze-lyrics";

const TYPE_LABELS: Record<ComprehensionQuestion["type"], string> = {
  comprehension: "Compréhension",
  reflection: "Réflexion",
  vocabulary: "Vocabulaire",
};

interface ComprehensionQuestionsProps {
  questions: ComprehensionQuestion[];
}

export function ComprehensionQuestions({
  questions,
}: ComprehensionQuestionsProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-zinc-100">
        Questions de compréhension
      </h2>
      <div className="space-y-3">
        {questions.map((q, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]"
          >
            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === index ? null : index)
              }
              className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-white/[0.03]"
            >
              <div>
                <span className="mb-2 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                  {TYPE_LABELS[q.type]}
                </span>
                <p className="text-zinc-200">{q.question}</p>
              </div>
              <span className="shrink-0 text-zinc-600">
                {expanded === index ? "−" : "+"}
              </span>
            </button>

            {expanded === index && (
              <div className="border-t border-white/5 px-5 pb-5 pt-4">
                <p className="mb-3 text-sm text-zinc-400">
                  <span className="text-zinc-500">Réponse suggérée : </span>
                  {q.suggestedAnswer}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {q.keyPoints.map((point) => (
                    <li
                      key={point}
                      className="rounded-full bg-zinc-800/80 px-3 py-1 text-xs text-zinc-400"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
