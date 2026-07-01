"use client";

import { useEffect, useState } from "react";
import type { LyricsAnalysisResult } from "@/lib/prompts/analyze-lyrics";
import type { AnalyzeLyricsResponse } from "@/app/api/analyze-lyrics/route";
import type { Persona } from "@/lib/types/persona";
import { MEI_PERSONA } from "@/lib/personas/mei";
import {
  AnalysisHeader,
  DebugPanel,
  DemoBanner,
} from "@/components/lyrics/LyricsAnalysisDisplay";
import { VocabularyList } from "@/components/lyrics/VocabularyList";
import { IdiomsList } from "@/components/lyrics/IdiomsList";
import { ClozeExerciseCard } from "@/components/lyrics/ClozeExerciseCard";
import { ComprehensionQuestions } from "@/components/lyrics/ComprehensionQuestions";
import { PersonaSpeaker } from "@/components/persona/PersonaSpeaker";

export function LyricsModule() {
  const [lyrics, setLyrics] = useState("");
  const [musicGenre, setMusicGenre] = useState("");
  const [favoriteArtist, setFavoriteArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LyricsAnalysisResult | null>(null);
  const [persona, setPersona] = useState<Persona>(MEI_PERSONA);
  const [isDemo, setIsDemo] = useState(false);
  const [savedInfo, setSavedInfo] = useState<{
    lessonId: string;
    vocabularyCount: number;
  } | null>(null);
  const [debug, setDebug] = useState<AnalyzeLyricsResponse["debug"]>();

  useEffect(() => {
    fetch("/api/personas/music")
      .then((res) => res.json())
      .then((data: { persona?: Persona }) => {
        if (data.persona) setPersona(data.persona);
      })
      .catch(() => {
        setPersona(MEI_PERSONA);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setSavedInfo(null);
    setDebug(undefined);

    try {
      const response = await fetch("/api/analyze-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics,
          musicGenre: musicGenre || undefined,
          favoriteArtist: favoriteArtist || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Erreur inconnue");
      }

      setAnalysis(data.analysis);
      setIsDemo(Boolean(data.demo));
      setSavedInfo(data.saved ?? null);
      setDebug(data.debug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Formulaire */}
      <section className="mb-12">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/80">
            Module Paroles
          </p>
          <h1 className="font-display text-4xl font-light text-zinc-50 sm:text-5xl">
            Vos chansons,
            <span className="block text-amber-400">votre vocabulaire</span>
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            Collez les paroles d&apos;une chanson que vous aimez. L&apos;IA extrait
            le vocabulaire clé, les idiomes et génère des exercices adaptés à
            votre niveau.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-zinc-500">
                Genre musical (optionnel)
              </span>
              <input
                type="text"
                value={musicGenre}
                onChange={(e) => setMusicGenre(e.target.value)}
                placeholder="indie rock, pop, rap..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-zinc-500">
                Artiste préféré (optionnel)
              </span>
              <input
                type="text"
                value={favoriteArtist}
                onChange={(e) => setFavoriteArtist(e.target.value)}
                placeholder="The Beatles, Billie Eilish..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-zinc-500">
              Paroles de la chanson
            </span>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              required
              rows={10}
              placeholder="Paste your lyrics here..."
              className="w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 font-mono text-sm leading-relaxed text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
            />
          </label>

          <p className="text-xs text-zinc-600">
            Usage personnel uniquement — vos paroles restent privées et ne sont
            pas partagées entre utilisateurs.
          </p>

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || lyrics.trim().length < 20}
            className="group relative overflow-hidden rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
                Analyse en cours...
              </span>
            ) : (
              "Analyser les paroles"
            )}
          </button>
        </form>
      </section>

      {/* Résultats */}
      {analysis && (
        <section className="space-y-12 border-t border-white/5 pt-12">
          {isDemo && <DemoBanner />}
          {savedInfo && (
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {savedInfo.vocabularyCount} mot(s) ajoutes a votre revision
              personnelle.
            </div>
          )}
          <PersonaSpeaker
            persona={persona}
            speechText={analysis.coachSpeechEn}
            subtitle={analysis.summary}
          />
          <AnalysisHeader analysis={analysis} />
          <VocabularyList items={analysis.vocabulary} />
          <IdiomsList items={analysis.idioms} />
          <ClozeExerciseCard exercise={analysis.clozeExercise} />
          <ComprehensionQuestions questions={analysis.comprehensionQuestions} />

          {analysis.culturalNotes && analysis.culturalNotes.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-2xl text-zinc-100">
                Notes culturelles
              </h2>
              <ul className="space-y-2">
                {analysis.culturalNotes.map((note, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <DebugPanel debug={debug} />
        </section>
      )}
    </div>
  );
}
