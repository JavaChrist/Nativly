import {
  getElevenLabsApiKey,
  getElevenLabsDefaultVoiceId,
} from "@/config/env.server";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function synthesizeSpeech(
  text: string,
  voiceId?: string | null,
): Promise<ArrayBuffer> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY non configuree");
  }

  const resolvedVoiceId = voiceId?.trim() || getElevenLabsDefaultVoiceId();
  const response = await fetch(`${ELEVENLABS_TTS_URL}/${resolvedVoiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "ElevenLabs TTS a echoue");
  }

  return response.arrayBuffer();
}

const ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";

/** Transcrit un fichier audio via ElevenLabs Scribe. Retourne le texte. */
export async function transcribeSpeech(
  audio: File | Blob,
  languageCode?: string,
): Promise<string> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY non configuree");
  }

  const form = new FormData();
  form.append(
    "file",
    audio,
    audio instanceof File ? audio.name : "recording.webm",
  );
  form.append("model_id", "scribe_v1");
  if (languageCode) {
    form.append("language_code", languageCode);
  }

  const response = await fetch(ELEVENLABS_STT_URL, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "ElevenLabs STT a echoue");
  }

  const data = (await response.json()) as { text?: string };
  return (data.text ?? "").trim();
}
