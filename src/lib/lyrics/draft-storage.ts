const DRAFT_KEY = "nativly:lyrics-draft";

export interface LyricsDraft {
  lyrics: string;
  musicGenre: string;
  favoriteArtist: string;
  updatedAt: string;
}

export function loadLyricsDraft(): LyricsDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LyricsDraft;
  } catch {
    return null;
  }
}

export function saveLyricsDraft(draft: Omit<LyricsDraft, "updatedAt">): void {
  if (typeof window === "undefined") return;

  const payload: LyricsDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function clearLyricsDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
