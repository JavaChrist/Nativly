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
