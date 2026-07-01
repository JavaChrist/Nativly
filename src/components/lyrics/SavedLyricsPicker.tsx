"use client";

import { useEffect, useState } from "react";
import type { SavedLyricsLessonSummary } from "@/lib/lyrics/saved-lessons";

interface SavedLyricsPickerProps {
  onSelect: (lessonId: string) => void;
  loadingId?: string | null;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function SavedLyricsPicker({
  onSelect,
  loadingId,
}: SavedLyricsPickerProps) {
  const [lessons, setLessons] = useState<SavedLyricsLessonSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "guest" | "empty">(
    "loading",
  );

  useEffect(() => {
    fetch("/api/lessons/lyrics")
      .then(async (res) => {
        if (res.status === 401) {
          setStatus("guest");
          return null;
        }
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<{ lessons: SavedLyricsLessonSummary[] }>;
      })
      .then((data) => {
        if (!data) return;
        setLessons(data.lessons);
        setStatus(data.lessons.length > 0 ? "ready" : "empty");
      })
      .catch(() => setStatus("guest"));
  }, []);

  if (status === "loading") {
    return (
      <p className="text-xs text-zinc-600">Chargement de vos paroles sauvegardees...</p>
    );
  }

  if (status === "guest") {
    return (
      <p className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-zinc-500">
        Connectez-vous pour retrouver vos paroles sauvegardees en base. En attendant,
        votre brouillon local est conserve dans ce navigateur.
      </p>
    );
  }

  if (status === "empty") {
    return (
      <p className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-zinc-500">
        Aucune lecon sauvegardee pour l&apos;instant. Apres une analyse connecte,
        vos paroles apparaitront ici.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Mes paroles sauvegardees
      </p>
      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <button
              type="button"
              onClick={() => onSelect(lesson.id)}
              disabled={loadingId === lesson.id}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-left transition hover:border-amber-500/30 hover:bg-white/[0.03] disabled:opacity-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-zinc-200">
                  {lesson.title}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-600">
                  {formatDate(lesson.generatedAt)} · {lesson.targetCefrLevel}
                </span>
              </span>
              <span className="shrink-0 text-xs text-amber-400/90">
                {loadingId === lesson.id ? "..." : "Rouvrir"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
