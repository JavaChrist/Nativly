"use client";

import type { VocabularyItem } from "@/lib/prompts/analyze-lyrics";
import { CEFR_LEVELS } from "@/lib/types/cefr";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-500/20 text-emerald-300",
  A2: "bg-teal-500/20 text-teal-300",
  B1: "bg-amber-500/20 text-amber-300",
  B2: "bg-orange-500/20 text-orange-300",
  C1: "bg-rose-500/20 text-rose-300",
};

interface VocabularyListProps {
  items: VocabularyItem[];
}

export function VocabularyList({ items }: VocabularyListProps) {
  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-zinc-100">
        Vocabulaire clé
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.word}
            className="group rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-amber-500/20 hover:bg-white/[0.05]"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-semibold text-amber-200">{item.word}</h3>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${LEVEL_COLORS[item.difficulty] ?? ""}`}
              >
                {item.difficulty}
              </span>
            </div>
            <p className="mb-2 text-sm text-zinc-300">{item.translation}</p>
            {item.partOfSpeech && (
              <p className="mb-2 text-xs italic text-zinc-500">
                {item.partOfSpeech}
              </p>
            )}
            <p className="border-l-2 border-amber-500/30 pl-3 text-sm italic text-zinc-400">
              &ldquo;{item.contextSentence}&rdquo;
            </p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        Niveaux CECRL : {CEFR_LEVELS.join(" · ")}
      </p>
    </section>
  );
}
