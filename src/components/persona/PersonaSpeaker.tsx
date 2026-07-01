"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Persona } from "@/lib/types/persona";

interface PersonaSpeakerProps {
  persona: Persona;
  speechText: string;
  subtitle?: string;
}

function pickEnglishFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (voice) =>
      voice.lang.startsWith("en") &&
      /female|samantha|victoria|zira|karen|moira|fiona/i.test(
        `${voice.name} ${voice.voiceURI}`,
      ),
  );

  if (preferred) return preferred;

  return voices.find((voice) => voice.lang.startsWith("en")) ?? null;
}

export function PersonaSpeaker({
  persona,
  speechText,
  subtitle,
}: PersonaSpeakerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"elevenlabs" | "browser" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      stop();
      if (audioRef.current?.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [stop]);

  const speakWithBrowser = useCallback(() => {
    if (!window.speechSynthesis) {
      setError("La synthese vocale du navigateur n'est pas disponible.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.voice = pickEnglishFemaleVoice();
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError("Lecture vocale interrompue.");
    };
    utteranceRef.current = utterance;
    setVoiceMode("browser");
    window.speechSynthesis.speak(utterance);
  }, [speechText]);

  const speak = useCallback(async () => {
    stop();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: speechText,
          voiceId: persona.voiceId ?? undefined,
        }),
      });

      if (response.status === 503) {
        speakWithBrowser();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Impossible de generer la voix");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setError("Lecture audio impossible.");
      };
      setVoiceMode("elevenlabs");
      await audio.play();
    } catch (err) {
      speakWithBrowser();
      if (err instanceof Error && !window.speechSynthesis) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [persona.voiceId, speakWithBrowser, speechText, stop]);

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
            Votre coach
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

          {error && (
            <p className="mt-3 text-xs text-rose-300">{error}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={speak}
              disabled={isLoading || isSpeaking}
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {isLoading
                ? "Preparation..."
                : isSpeaking
                  ? "En lecture..."
                  : `Ecouter ${persona.name}`}
            </button>
            {(isSpeaking || isLoading) && (
              <button
                type="button"
                onClick={stop}
                className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
              >
                Stop
              </button>
            )}
            {voiceMode === "browser" && !isSpeaking && !isLoading && (
              <span className="text-xs text-zinc-600">
                Voix navigateur (ajoutez ELEVENLABS_API_KEY pour une voix premium)
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
