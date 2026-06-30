import Anthropic from "@anthropic-ai/sdk";
import {
  getAnthropicApiKey,
  getAnthropicModel,
  isDebugPromptsEnabled,
} from "@/config/env.server";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY manquante");
  }

  if (!client) {
    client = new Anthropic({ apiKey });
  }

  return client;
}

export interface ClaudeJsonRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

export interface ClaudeJsonResponse<T> {
  data: T;
  rawText: string;
  debug?: {
    system: string;
    user: string;
    rawResponse: string;
  };
}

/**
 * Extrait et parse un bloc JSON depuis la réponse Claude.
 * Gère les réponses entourées de markdown ou de texte parasite.
 */
export function extractJsonFromText(text: string): unknown {
  const trimmed = text.trim();

  // Tentative directe
  try {
    return JSON.parse(trimmed);
  } catch {
    // Cherche un objet JSON dans la réponse
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Impossible d'extraire du JSON valide de la réponse Claude");
  }
}

export async function callClaudeForJson<T>(
  request: ClaudeJsonRequest,
  parse: (raw: unknown) => T,
): Promise<ClaudeJsonResponse<T>> {
  const anthropic = getAnthropicClient();
  const model = getAnthropicModel();

  const message = await anthropic.messages.create({
    model,
    max_tokens: request.maxTokens ?? 4096,
    system: request.system,
    messages: [{ role: "user", content: request.user }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse Claude vide ou non textuelle");
  }

  const rawText = textBlock.text;

  let data: T;
  try {
    const json = extractJsonFromText(rawText);
    data = parse(json);
  } catch (error) {
    // Fallback : une seconde tentative avec un prompt de correction implicite
    const repairMessage = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system:
        "Fix the following malformed JSON. Return ONLY valid JSON, nothing else.",
      messages: [
        {
          role: "user",
          content: `Original response:\n${rawText}\n\nError: ${error instanceof Error ? error.message : "parse error"}`,
        },
      ],
    });

    const repairBlock = repairMessage.content.find(
      (block) => block.type === "text",
    );
    if (!repairBlock || repairBlock.type !== "text") {
      throw new Error("Échec du fallback de parsing JSON");
    }

    const repairedJson = extractJsonFromText(repairBlock.text);
    data = parse(repairedJson);
  }

  const response: ClaudeJsonResponse<T> = {
    data,
    rawText,
  };

  if (isDebugPromptsEnabled()) {
    response.debug = {
      system: request.system,
      user: request.user,
      rawResponse: rawText,
    };
  }

  return response;
}
