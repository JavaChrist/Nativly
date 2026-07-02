/** Normalise un texte pour comparaison phonetique approximative. */
export function normalizeSpoken(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Distance de Levenshtein entre deux chaines. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }

  return prev[b.length];
}

/** Score de similarite 0-1 entre la cible et ce qui a ete prononce. */
export function pronunciationScore(target: string, spoken: string): number {
  const normTarget = normalizeSpoken(target);
  const normSpoken = normalizeSpoken(spoken);
  if (!normTarget || !normSpoken) return 0;
  if (normTarget === normSpoken) return 1;

  const distance = levenshtein(normTarget, normSpoken);
  const maxLen = Math.max(normTarget.length, normSpoken.length);
  return Math.max(0, 1 - distance / maxLen);
}

export type PronunciationVerdict = "correct" | "close" | "retry";

export function verdictFromScore(score: number): PronunciationVerdict {
  if (score >= 0.85) return "correct";
  if (score >= 0.6) return "close";
  return "retry";
}

/** Phrase que Mei prononce en retour selon le resultat. */
export function buildPronunciationFeedback(
  target: string,
  verdict: PronunciationVerdict,
): string {
  switch (verdict) {
    case "correct":
      return `Perfect! You said "${target}" very well.`;
    case "close":
      return `Almost there. Listen again: "${target}". Now try one more time.`;
    default:
      return `Let's practice this one. The word is "${target}". Repeat after me.`;
  }
}
