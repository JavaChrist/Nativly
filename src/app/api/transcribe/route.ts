import { NextResponse } from "next/server";
import { transcribeSpeech } from "@/lib/speech/elevenlabs";
import { hasElevenLabsKey } from "@/config/env.server";

export async function POST(request: Request) {
  try {
    if (!hasElevenLabsKey()) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY non configuree" },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json(
        { error: "Fichier audio manquant" },
        { status: 400 },
      );
    }

    const languageCode =
      typeof formData.get("language") === "string"
        ? (formData.get("language") as string)
        : undefined;

    const text = await transcribeSpeech(audio, languageCode);

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur de transcription",
      },
      { status: 500 },
    );
  }
}
