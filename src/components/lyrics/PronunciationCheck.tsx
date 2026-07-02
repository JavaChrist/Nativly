"use client";

import { useEffect, useRef, useState } from "react";
import { useMicTranscription } from "@/hooks/useMicTranscription";
import {
  buildPronunciationFeedback,
  pronunciationScore,
  verdictFromScore,
  type PronunciationVerdict,
} from "@/lib/lyrics/pronunciation";

interface PronunciationCheckProps {
  /** Mot ou phrase cible a prononcer. */
  target: string;
  /** Appele avec une phrase que Mei doit dire en retour. */
  onFeedbackSpeech?: (speech: string) => void;
  className?: string;
}

const VERDICT_STYLES: Record<PronunciationVerdict, string> = {
  correct: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  close: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  retry: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

const VERDICT_LABEL: Record<PronunciationVerdict, string> = {
  correct: "Parfait",
  close: "Presque",
  retry: "A retravailler",
};

export function PronunciationCheck({
  target,
  onFeedbackSpeech,
  className,
}: PronunciationCheckProps) {
  const {
    isRecording,
    isTranscribing,
    transcript,
    error,
    start,
    stop,
    reset,
  } = useMicTranscription("eng");
  const [verdict, setVerdict] = useState<PronunciationVerdict | null>(null);
  const [score, setScore] = useState(0);
  const lastScored = useRef<string | null>(null);

  useEffect(() => {
    if (!transcript || transcript === lastScored.current) return;
    lastScored.current = transcript;

    const s = pronunciationScore(target, transcript);
    const v = verdictFromScore(s);
    setScore(s);
    setVerdict(v);
    onFeedbackSpeech?.(buildPronunciationFeedback(target, v));
  }, [transcript, target, onFeedbackSpeech]);

  function handleClick() {
    if (isRecording) {
      stop();
      return;
    }
    setVerdict(null);
    setScore(0);
    lastScored.current = null;
    reset();
    void start();
  }

  const label = isRecording
    ? "J'ecoute... (cliquez pour arreter)"
    : isTranscribing
      ? "Analyse..."
      : "Prononcez";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isTranscribing}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition disabled:opacity-60 ${
          isRecording
            ? "border-rose-500/50 bg-rose-500/15 text-rose-200"
            : "border-violet-500/40 text-violet-200 hover:bg-violet-500/10"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isRecording ? "animate-pulse bg-rose-400" : "bg-violet-400"
          }`}
        />
        {label}
      </button>

      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}

      {verdict && !isRecording && !isTranscribing && (
        <div
          className={`mt-2 rounded-lg border px-3 py-2 text-xs ${VERDICT_STYLES[verdict]}`}
        >
          <p className="font-semibold">
            {VERDICT_LABEL[verdict]} · {Math.round(score * 100)}%
          </p>
          {transcript && (
            <p className="mt-0.5 text-zinc-400">
              Entendu : &ldquo;{transcript}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
