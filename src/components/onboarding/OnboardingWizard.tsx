"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  WRITTEN_PLACEMENT_QUESTIONS,
  computeWrittenLevel,
  indexToLevel,
  type WrittenQuestion,
} from "@/lib/placement/written-questions";
import type { CefrLevel } from "@/lib/types/cefr";

const ORAL_PROMPTS = [
  "Parlez d'une chanson que vous aimez et pourquoi elle compte pour vous.",
  "Decrivez ce que vous avez fait le week-end dernier.",
];

type Step = "interests" | "written" | "oral" | "done";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("interests");
  const [musicGenre, setMusicGenre] = useState("");
  const [favoriteArtist, setFavoriteArtist] = useState("");

  const [difficultyIndex, setDifficultyIndex] = useState(2);
  const [writtenAnswers, setWrittenAnswers] = useState<
    { questionId: string; selectedIndex: number }[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState<WrittenQuestion | null>(
    () => WRITTEN_PLACEMENT_QUESTIONS.find((q) => q.level === "B1") ?? null,
  );
  const [writtenLevel, setWrittenLevel] = useState<CefrLevel>("B1");

  const [oralResponses, setOralResponses] = useState(["", ""]);
  const [spokenLevel, setSpokenLevel] = useState<CefrLevel>("B1");
  const [oralSummary, setOralSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const writtenProgress = writtenAnswers.length;
  const writtenTotal = 8;

  const usedQuestionIds = useMemo(
    () => new Set(writtenAnswers.map((a) => a.questionId)),
    [writtenAnswers],
  );

  function pickNextQuestion(nextIndex: number): WrittenQuestion | null {
    const targetLevel = indexToLevel(nextIndex);
    const pool = WRITTEN_PLACEMENT_QUESTIONS.filter(
      (q) => !usedQuestionIds.has(q.id) && q.level === targetLevel,
    );
    if (pool.length > 0) return pool[0];

    const fallback = WRITTEN_PLACEMENT_QUESTIONS.find(
      (q) => !usedQuestionIds.has(q.id),
    );
    return fallback ?? null;
  }

  function handleWrittenAnswer(selectedIndex: number) {
    if (!currentQuestion) return;

    const correct = selectedIndex === currentQuestion.correctIndex;
    const nextIndex = correct
      ? Math.min(4, difficultyIndex + 1)
      : Math.max(0, difficultyIndex - 1);

    const newAnswers = [
      ...writtenAnswers,
      { questionId: currentQuestion.id, selectedIndex },
    ];

    setWrittenAnswers(newAnswers);
    setDifficultyIndex(nextIndex);

    if (newAnswers.length >= writtenTotal) {
      const result = computeWrittenLevel(newAnswers);
      setWrittenLevel(result.level);
      setStep("oral");
      return;
    }

    setCurrentQuestion(pickNextQuestion(nextIndex));
  }

  async function handleOralSubmit() {
    setLoading(true);
    setError(null);

    try {
      const filtered = oralResponses.filter((r) => r.trim().length >= 5);
      if (filtered.length < 1) {
        throw new Error("Repondez a au moins une question en anglais.");
      }

      const evalRes = await fetch("/api/onboarding/evaluate-oral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: filtered,
          writtenLevel,
        }),
      });

      const evalData = await evalRes.json();
      if (!evalRes.ok) throw new Error(evalData.error ?? "Evaluation orale echouee");

      setSpokenLevel(evalData.spokenLevel);
      setOralSummary(evalData.summary ?? "");

      const completeRes = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musicGenre,
          favoriteArtist,
          writtenAnswers,
          oralResponses: filtered,
          spokenLevel: evalData.spokenLevel,
          oralSummary: evalData.summary,
        }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        throw new Error(completeData.error ?? "Enregistrement echoue");
      }

      setStep("done");
      setTimeout(() => {
        router.push("/music/lyrics");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/80">
        Onboarding
      </p>
      <h1 className="mb-8 font-display text-4xl text-zinc-50">
        Calibrons votre parcours
      </h1>

      {step === "interests" && (
        <section className="space-y-5 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <h2 className="text-lg text-zinc-200">Vos gouts musicaux</h2>
          <p className="text-sm text-zinc-500">
            Ces infos personnalisent vos premieres lecons.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-xs text-zinc-500">Genre musical</span>
            <input
              value={musicGenre}
              onChange={(e) => setMusicGenre(e.target.value)}
              placeholder="indie rock, pop, rap..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-amber-500/40"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-zinc-500">
              Artiste prefere
            </span>
            <input
              value={favoriteArtist}
              onChange={(e) => setFavoriteArtist(e.target.value)}
              placeholder="Billie Eilish, The Beatles..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-amber-500/40"
            />
          </label>
          <button
            type="button"
            disabled={!musicGenre.trim() || !favoriteArtist.trim()}
            onClick={() => setStep("written")}
            className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-40"
          >
            Test ecrit
          </button>
        </section>
      )}

      {step === "written" && currentQuestion && (
        <section className="space-y-5 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>Test ecrit adaptatif</span>
            <span>
              {writtenProgress + 1} / {writtenTotal}
            </span>
          </div>
          <p className="text-lg text-zinc-200">{currentQuestion.question}</p>
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => handleWrittenAnswer(index)}
                className="block w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-zinc-300 hover:border-amber-500/30 hover:bg-white/[0.04]"
              >
                {option}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600">
            Difficulte actuelle : {indexToLevel(difficultyIndex)}
          </p>
        </section>
      )}

      {step === "oral" && (
        <section className="space-y-5 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <h2 className="text-lg text-zinc-200">Test oral (expression)</h2>
          <p className="text-sm text-zinc-500">
            Repondez en anglais en 2-4 phrases. Ecrivez ou dictez (micro du
            navigateur).
          </p>
          {ORAL_PROMPTS.map((prompt, index) => (
            <label key={prompt} className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">{prompt}</span>
              <textarea
                value={oralResponses[index]}
                onChange={(e) => {
                  const next = [...oralResponses];
                  next[index] = e.target.value;
                  setOralResponses(next);
                }}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-amber-500/40"
              />
            </label>
          ))}
          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleOralSubmit}
            disabled={loading}
            className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Evaluation..." : "Terminer l'onboarding"}
          </button>
        </section>
      )}

      {step === "done" && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <p className="text-lg text-emerald-200">Profil configure !</p>
          <p className="mt-2 text-sm text-zinc-400">
            Ecrit : {writtenLevel} · Oral : {spokenLevel}
          </p>
          <p className="mt-4 text-xs text-zinc-500">
            Redirection vers le module Paroles...
          </p>
        </section>
      )}
    </div>
  );
}
