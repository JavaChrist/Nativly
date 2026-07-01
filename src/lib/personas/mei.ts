import type { Persona } from "@/lib/types/persona";

/** Fallback si la BDD n'est pas joignable ou migration non appliquee */
export const MEI_PERSONA: Persona = {
  name: "Mei",
  toneDescription: "Coach anglais — module Musique",
  avatarUrl: "/personas/persona-coach-portrait.png",
  voiceId: null,
};
