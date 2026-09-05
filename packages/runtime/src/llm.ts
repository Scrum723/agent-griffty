import OpenAI from "openai";

/**
 * SpaceXAI (xAI) client. Server-side only.
 * Default model grok-4.6 — confirm at https://docs.x.ai/developers/models
 */
export function xaiClient(): OpenAI | null {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: process.env.XAI_BASE_URL ?? "https://api.x.ai/v1",
  });
}

export const DEFAULT_MODEL = process.env.XAI_MODEL ?? "grok-4.6";

export async function completeJson(args: {
  system: string;
  user: string;
}): Promise<string | null> {
  const client = xaiClient();
  if (!client) return null;
  const resp = await client.responses.create({
    model: DEFAULT_MODEL,
    input: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  });
  const text = (resp as { output_text?: string }).output_text;
  return text ?? null;
}
