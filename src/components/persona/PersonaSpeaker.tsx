"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Persona } from "@/lib/types/persona";
import { usePersonaSpeech, type SpeakFn } from "@/hooks/usePersonaSpeech";

interface PersonaSpeakerProps {
  persona: Persona;
  speechText: string;
  subtitle?: string;
  autoSpeak?: boolean;
  onSpeakReady?: (speak: SpeakFn) => void;
}

export function PersonaSpeaker({
  persona,
  speechText,
  subtitle,
  autoSpeak = false,
  onSpeakReady,
}: PersonaSpeakerProps) {
  const { speak, stop, isSpeaking, isLoading, voiceMode, error } =
    usePersonaSpeech(persona.voiceId);
  const lastAutoText = useRef<string | null>(null);

  useEffect(() => {
    onSpeakReady?.(speak);
  }, [onSpeakReady, speak]);

  useEffect(() => {
    if (!autoSpeak || !speechText) return;
    if (lastAutoText.current === speechText) return;
    lastAutoText.current = speechText;
    void speak(speechText);
  }, [autoSpeak, speak, speechText]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-zinc-900/80 to-amber-950/20 p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <div
            className={`relative h-36 w-36 overflow-hidden rounded-2xl ring-2 transition-all duration-300 ${
              isSpeaking
                ? "ring-amber-400/70 shadow-[0_0_32px_rgba(251,191,36,0.35)]"
                : "ring-white/10"
            }`}
          >
            <Image
              src={persona.avatarUrl}
              alt={persona.name}
              fill
              className="object-cover object-top"
              sizes="144px"
              priority
            />
          </div>
          {isSpeaking && (
            <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-amber-500/20 px-3 py-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/80">
            Votre prof
          </p>
          <h2 className="font-display text-2xl text-zinc-50">{persona.name}</h2>
          {persona.toneDescription && (
            <p className="mt-1 text-sm text-zinc-500">{persona.toneDescription}</p>
          )}

          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
            <p className="text-sm leading-relaxed text-zinc-200">{speechText}</p>
            {subtitle && (
              <p className="mt-3 border-t border-white/5 pt-3 text-sm leading-relaxed text-zinc-500">
                {subtitle}
              </p>
            )}
          </div>

          {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => speak(speechText)}
              disabled={isLoading || isSpeaking}
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {isLoading ? "..." : isSpeaking ? "Parle..." : "Ecouter Mei"}
            </button>
            <button
              type="button"
              onClick={() => speak(speechText)}
              disabled={isLoading || isSpeaking}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
            >
              Repeter
            </button>
            <button
              type="button"
              onClick={() => speak(speechText, { slow: true })}
              disabled={isLoading || isSpeaking}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
            >
              Plus lentement
            </button>
            {(isSpeaking || isLoading) && (
              <button
                type="button"
                onClick={stop}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Stop
              </button>
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-600">
            Apres l&apos;analyse, cliquez <strong className="text-zinc-400">Ecouter Mei</strong>{" "}
            (le navigateur bloque souvent la lecture automatique). Mei corrige aussi
            l&apos;exercice a trous et lit le vocabulaire via les boutons dedies.
            {voiceMode === "browser" &&
              " Voix navigateur active (ajoutez ELEVENLABS_API_KEY pour la voix premium)."}
          </p>
        </div>
      </div>
    </section>
  );
}
