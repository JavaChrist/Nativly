"use client";

import type { LyricsAnalysisResult } from "@/lib/prompts/analyze-lyrics";

interface DebugPanelProps {
  debug?: {
    system: string;
    user: string;
    rawResponse: string;
  };
}

export function DebugPanel({ debug }: DebugPanelProps) {
  if (!debug) return null;

  return (
    <details className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <summary className="cursor-pointer text-sm font-medium text-amber-300">
        Mode debug pédagogique (NATIVLY_DEBUG_PROMPTS=true)
      </summary>
      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">
            System prompt
          </p>
          <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-zinc-300">
            {debug.system}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">
            User prompt
          </p>
          <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-zinc-300">
            {debug.user}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">
            Réponse brute
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-zinc-300">
            {debug.rawResponse}
          </pre>
        </div>
      </div>
    </details>
  );
}

export function DemoBanner() {
  return (
    <div className="mb-6 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
      Mode démo — ajoutez <code className="text-violet-100">ANTHROPIC_API_KEY</code>{" "}
      dans <code className="text-violet-100">.env.local</code> pour une analyse IA
      réelle.
    </div>
  );
}

interface AnalysisHeaderProps {
  analysis: LyricsAnalysisResult;
}

export function AnalysisHeader({ analysis }: AnalysisHeaderProps) {
  return (
    <header className="mb-10">
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
          Niveau {analysis.overallDifficulty}
        </span>
        <span className="text-xs text-zinc-500">
          {analysis.vocabulary.length} mots · {analysis.idioms.length} expressions
        </span>
      </div>
      <p className="text-lg leading-relaxed text-zinc-300">{analysis.summary}</p>
    </header>
  );
}
