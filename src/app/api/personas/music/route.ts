import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MEI_PERSONA } from "@/lib/personas/mei";
import type { Persona } from "@/lib/types/persona";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: theme } = await supabase
      .from("themes")
      .select("id")
      .eq("slug", "music")
      .maybeSingle();

    if (!theme) {
      return NextResponse.json({ persona: MEI_PERSONA });
    }

    const { data, error } = await supabase
      .from("personas")
      .select("id, name, tone_description, avatar_url, voice_id")
      .eq("theme_id", theme.id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ persona: MEI_PERSONA });
    }

    const persona: Persona = {
      id: data.id,
      name: data.name,
      toneDescription: data.tone_description,
      avatarUrl: data.avatar_url ?? MEI_PERSONA.avatarUrl,
      voiceId: data.voice_id,
    };

    return NextResponse.json({ persona });
  } catch {
    return NextResponse.json({ persona: MEI_PERSONA });
  }
}
