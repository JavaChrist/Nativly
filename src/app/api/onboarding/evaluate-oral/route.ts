import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { callClaudeForJson } from "@/lib/ai/claude";
import {
  buildEvaluateOralPrompt,
  parseOralEvaluation,
} from "@/lib/prompts/evaluate-oral";
import { hasAnthropicKey } from "@/config/env.server";
import type { CefrLevel } from "@/lib/types/cefr";

const bodySchema = z.object({
  responses: z.array(z.string().min(5)).min(1).max(3),
  writtenLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
});

const ORAL_PROMPTS = [
  "Tell me about a song you love and why it matters to you.",
  "Describe what you did last weekend.",
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Reponses invalides" }, { status: 400 });
    }

    const { responses, writtenLevel } = parsed.data;
    const prompts = ORAL_PROMPTS.slice(0, responses.length);

    if (!hasAnthropicKey()) {
      return NextResponse.json({
        spokenLevel: writtenLevel,
        summary: "Evaluation orale estimee au niveau ecrit (mode sans IA).",
        strengths: ["Reponses fournies"],
        gaps: [],
      });
    }

    const prompt = buildEvaluateOralPrompt({
      prompts,
      responses,
      writtenLevel: writtenLevel as CefrLevel,
    });

    const result = await callClaudeForJson(prompt, parseOralEvaluation);

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[evaluate-oral]", error);
    return NextResponse.json(
      { error: "Erreur evaluation orale" },
      { status: 500 },
    );
  }
}
