import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

function hasAnthropicKey() {
  const k = process.env.ANTHROPIC_API_KEY;
  return k && k !== "your_anthropic_api_key";
}

function hasOpenAIKey() {
  const k = process.env.OPENAI_API_KEY;
  return k && k !== "your_openai_api_key";
}

export interface GenerateOptions {
  maxTokens?: number;
}

export async function generateText(
  userPrompt: string,
  systemPrompt = "You are a helpful AI assistant.",
  options?: GenerateOptions
): Promise<string> {
  const maxTokens = options?.maxTokens ?? 16384;

  if (hasAnthropicKey()) {
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await claude.messages.create({
      model: "claude-opus-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    return (msg.content[0] as { type: "text"; text: string }).text;
  }

  if (hasOpenAIKey()) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
    });
    return res.choices[0].message.content ?? "";
  }

  throw new Error(
    "No AI provider configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local"
  );
}

export async function streamText(
  userPrompt: string,
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  if (hasAnthropicKey()) {
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = claude.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        onChunk(event.delta.text);
      }
    }
    return;
  }

  if (hasOpenAIKey()) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      max_tokens: 16384,
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) onChunk(text);
    }
    return;
  }

  throw new Error(
    "No AI provider configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local"
  );
}
