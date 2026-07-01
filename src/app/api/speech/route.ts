import { NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSpeech } from "@/lib/speech/elevenlabs";
import { hasElevenLabsKey } from "@/config/env.server";

const requestSchema = z.object({
  text: z.string().min(1).max(2500),
  voiceId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    if (!hasElevenLabsKey()) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY non configuree", fallback: "browser" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Requete invalide" },
        { status: 400 },
      );
    }

    const audio = await synthesizeSpeech(
      parsed.data.text,
      parsed.data.voiceId,
    );

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur synthese vocale",
      },
      { status: 500 },
    );
  }
}
