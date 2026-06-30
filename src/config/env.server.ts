import "server-only";

/** Variables serveur uniquement — ne jamais importer dans un Client Component */
export function getAnthropicApiKey(): string {
  return process.env.ANTHROPIC_API_KEY?.trim() ?? "";
}

/** Modele Claude actif (claude-sonnet-4-20250514 est retire depuis juin 2026) */
export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";
}

export function hasAnthropicKey(): boolean {
  return getAnthropicApiKey().length > 0;
}

export function isDebugPromptsEnabled(): boolean {
  return process.env.NATIVLY_DEBUG_PROMPTS === "true";
}
