"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseMicTranscriptionResult {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Capture le micro via MediaRecorder puis transcrit cote serveur
 * (ElevenLabs Scribe). Fonctionne sur tous les navigateurs recents
 * (Chrome, Edge, Firefox, Safari) contrairement a l'API Web Speech.
 */
export function useMicTranscription(
  language = "eng",
): UseMicTranscriptionResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      recorderRef.current?.state === "recording" && recorderRef.current.stop();
      cleanupStream();
    };
  }, [cleanupStream]);

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("L'enregistrement micro n'est pas disponible dans ce navigateur.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "Acces au micro refuse. Autorisez le micro via l'icone de la barre d'adresse.",
      );
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      cleanupStream();
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      if (blob.size === 0) {
        setError("Aucun son capture. Reessayez.");
        return;
      }

      setIsTranscribing(true);
      try {
        const form = new FormData();
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        form.append("audio", blob, `recording.${ext}`);
        form.append("language", language);

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Transcription impossible");
        }

        const data = (await response.json()) as { text?: string };
        setTranscript((data.text ?? "").trim());
      } catch {
        setError("Transcription impossible. Reessayez.");
      } finally {
        setIsTranscribing(false);
      }
    };

    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }, [cleanupStream, language]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return { isRecording, isTranscribing, transcript, error, start, stop, reset };
}
