import Anthropic from "@anthropic-ai/sdk";

/**
 * Model provider abstraction. Switch with AI_PROVIDER=anthropic|openai.
 * Both expose a single `streamText()` that yields text chunks.
 */
export interface StreamArgs {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  /** Optional image (data URL) attached to the last user message. */
  image?: string | null;
  maxTokens?: number;
  temperature?: number;
}

export type Provider = "anthropic" | "openai";

export function activeProvider(): Provider {
  const p = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  return p === "openai" ? "openai" : "anthropic";
}

export function providerConfigured(): boolean {
  return activeProvider() === "openai" ? !!process.env.OPENAI_API_KEY : !!process.env.ANTHROPIC_API_KEY;
}

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  return m ? { mediaType: m[1], data: m[2] } : null;
}

async function* streamAnthropic(args: StreamArgs): AsyncGenerator<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  const messages: Anthropic.MessageParam[] = args.messages.map((m, i) => {
    const isLastUser = i === args.messages.length - 1 && m.role === "user";
    if (isLastUser && args.image) {
      const parsed = parseDataUrl(args.image);
      if (parsed) {
        return {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: parsed.mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
                data: parsed.data,
              },
            },
            { type: "text", text: m.content },
          ],
        };
      }
    }
    return { role: m.role, content: m.content };
  });

  const stream = client.messages.stream({
    model,
    max_tokens: args.maxTokens ?? 16000,
    temperature: args.temperature ?? 0.7,
    system: args.system,
    messages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

async function* streamOpenAI(args: StreamArgs): AsyncGenerator<string> {
  const model = process.env.OPENAI_MODEL || "gpt-4.1";
  const messages = [
    { role: "system", content: args.system },
    ...args.messages.map((m, i) => {
      const isLastUser = i === args.messages.length - 1 && m.role === "user";
      if (isLastUser && args.image) {
        return {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: args.image } },
            { type: "text", text: m.content },
          ],
        };
      }
      return { role: m.role, content: m.content };
    }),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: args.temperature ?? 0.7,
      max_tokens: args.maxTokens ?? 16000,
      messages,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        /* ignore partial */
      }
    }
  }
}

export function streamText(args: StreamArgs): AsyncGenerator<string> {
  return activeProvider() === "openai" ? streamOpenAI(args) : streamAnthropic(args);
}

export async function completeText(args: StreamArgs): Promise<string> {
  let out = "";
  for await (const chunk of streamText(args)) out += chunk;
  return out;
}
