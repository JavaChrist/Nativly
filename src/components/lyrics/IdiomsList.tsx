"use client";

import type { IdiomItem } from "@/lib/prompts/analyze-lyrics";

interface IdiomsListProps {
  items: IdiomItem[];
}

export function IdiomsList({ items }: IdiomsListProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-zinc-100">
        Expressions & idiomes
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.expression}
            className="rounded-2xl border border-white/5 bg-gradient-to-br from-violet-500/5 to-transparent p-5"
          >
            <h3 className="mb-1 text-lg font-semibold text-violet-200">
              {item.expression}
            </h3>
            <div className="mb-3 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-zinc-500">Littéral : </span>
                <span className="text-zinc-300">{item.literalMeaning}</span>
              </p>
              <p>
                <span className="text-zinc-500">Réel : </span>
                <span className="text-zinc-300">{item.actualMeaning}</span>
              </p>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-zinc-400">
              {item.explanation}
            </p>
            <p className="border-l-2 border-violet-500/40 pl-3 text-sm italic text-zinc-500">
              &ldquo;{item.exampleInContext}&rdquo;
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
