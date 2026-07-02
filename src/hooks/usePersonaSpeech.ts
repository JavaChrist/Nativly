"use client";

import { useCallback, useRef, useState } from "react";

let audioUnlocked = false;

/** A appeler pendant le geste utilisateur (clic) pour autoriser la lecture apres un fetch async. */
export function unlockAudioPlayback() {
  if (typeof window === "undefined" || audioUnlocked) return;

  try {
    const AudioCtx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      void ctx.resume();
    }
  } catch {
    /* ignore */
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  }

  const silent = new Audio(
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA",
  );
  silent.volume = 0.001;
  void silent.play().then(() => {
    audioUnlocked = true;
  }).catch(() => {
    /* le navigateur peut encore bloquer ; on retentera au prochain clic */
  });
}

function pickEnglishFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (voice) =>
      voice.lang.startsWith("en") &&
      /female|samantha|victoria|zira|karen|moira|fiona|lily/i.test(
        `${voice.name} ${voice.voiceURI}`,
      ),
  );

  return preferred ?? voices.find((voice) => voice.lang.startsWith("en")) ?? null;
}

export function usePersonaSpeech(voiceId?: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const speakWithBrowser = useCallback((text: string, rate = 0.95) => {
    if (!window.speechSynthesis) {
      setError("La synthese vocale du navigateur n'est pas disponible.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.voice = pickEnglishFemaleVoice();
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError("Lecture vocale interrompue.");
    };
    setVoiceMode("browser");
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    async (text: string, options?: { slow?: boolean }) => {
      stop();
      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voiceId: voiceId ?? undefined,
          }),
        });

        if (response.status === 503) {
          speakWithBrowser(text, options?.slow ? 0.78 : 0.95);
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Impossible de generer la voix");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.playbackRate = options?.slow ? 0.85 : 1;
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
        try {
          await audio.play();
        } catch {
          setError("Cliquez « Ecouter Mei » pour demarrer la voix.");
          throw new Error("autoplay_blocked");
        }
      } catch (err) {
        if (err instanceof Error && err.message === "autoplay_blocked") {
          return;
        }
        speakWithBrowser(text, options?.slow ? 0.78 : 0.95);
      } finally {
        setIsLoading(false);
      }
    },
    [speakWithBrowser, stop, voiceId],
  );

  return { speak, stop, isSpeaking, isLoading, voiceMode, error };
}

export type SpeakFn = ReturnType<typeof usePersonaSpeech>["speak"];
