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

export function getElevenLabsApiKey(): string {
  return process.env.ELEVENLABS_API_KEY?.trim() ?? "";
}

/** Voix ElevenLabs par defaut (Sarah — feminine, clear EN) */
export function getElevenLabsDefaultVoiceId(): string {
  return (
    process.env.ELEVENLABS_VOICE_ID?.trim() || "EXAVITQu4vr4xnSDxMaL"
  );
}

export function hasElevenLabsKey(): boolean {
  return getElevenLabsApiKey().length > 0;
}
