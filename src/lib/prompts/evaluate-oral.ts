import { z } from "zod";
import type { CefrLevel } from "@/lib/types/cefr";

export const oralEvaluationSchema = z.object({
  spokenLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  summary: z.string(),
  strengths: z.array(z.string()).max(3),
  gaps: z.array(z.string()).max(3),
});

export type OralEvaluationResult = z.infer<typeof oralEvaluationSchema>;

export interface EvaluateOralInput {
  prompts: string[];
  responses: string[];
  writtenLevel: CefrLevel;
}

export function buildEvaluateOralPrompt(input: EvaluateOralInput) {
  const pairs = input.prompts
    .map(
      (prompt, i) =>
        `Prompt ${i + 1}: ${prompt}\nResponse ${i + 1}: ${input.responses[i] ?? "(empty)"}`,
    )
    .join("\n\n");

  const system = `You evaluate English oral fluency for a French-speaking learner during a placement test.
Respond ONLY with valid JSON. Do not score pronunciation phonetically — focus on fluency, vocabulary range, grammar accuracy, and coherence.

Written level already estimated: ${input.writtenLevel}

JSON schema:
{
  "spokenLevel": "A1|A2|B1|B2|C1",
  "summary": "2 sentences in French",
  "strengths": ["max 3 items in French"],
  "gaps": ["max 3 items in French"]
}`;

  const user = `Evaluate these spoken responses (transcribed as text):\n\n${pairs}`;

  return { system, user };
}

export function parseOralEvaluation(raw: unknown): OralEvaluationResult {
  return oralEvaluationSchema.parse(raw);
}
