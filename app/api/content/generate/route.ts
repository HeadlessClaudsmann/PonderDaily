import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const PROMPTS_PATH = join(process.cwd(), "lib", "prompts.json");

type Band = "6-8" | "9-12" | "13-16";
type PromptEntry = {
  cellId: string; type: string; purpose: string; factual: boolean;
  bands: Record<Band, string>;
};
type BandContent = Record<string, { type: string; title: string; body: string }>;

// ── Build the prompt for one band ─────────────────────────────────────────────
function buildPrompt(
  theme: string,
  brief: string | undefined,
  band: Band,
  prompts: PromptEntry[],
): string {
  const sections = prompts.map((p, i) =>
    `## Section ${i + 1}: ${p.type} (cellId: "${p.cellId}")
Purpose: ${p.purpose}
${band} tone/level: ${p.bands[band]}`
  ).join("\n\n");

  return `You are writing content for Ponder Daily — a daily educational briefing for children and families.

Today's theme: "${theme}"${brief ? `\nAdditional context: ${brief}` : ""}
Age band: ${band} years old

Generate content for all 15 sections below. For each section, produce a JSON object with:
- "type": the section type name (given in the section header)
- "title": a short, punchy headline (max ~12 words, no full stops)
- "body": the main content text (length appropriate to the section type; use \\n to separate lines/paragraphs where needed)

${sections}

Respond with ONLY a valid JSON object mapping each cellId to its content, like:
{
  "aduz9fn": { "type": "Today's Story", "title": "...", "body": "..." },
  "ojb605w": { "type": "Who to Know", "title": "...", "body": "..." },
  ...
}
All 15 cellIds must be present. No markdown fences, no extra text — raw JSON only.`;
}

// ── Generate one band via Anthropic ──────────────────────────────────────────
async function generateBand(
  client: Anthropic,
  theme: string,
  brief: string | undefined,
  band: Band,
  prompts: PromptEntry[],
): Promise<BandContent> {
  const msg = await client.messages.create({
    model:      "claude-3-5-haiku-20241022",
    max_tokens: 4096,
    messages:   [{ role: "user", content: buildPrompt(theme, brief, band, prompts) }],
  });

  const raw = msg.content.find(b => b.type === "text")?.text ?? "";
  // Strip markdown fences if model adds them despite instructions
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleaned) as BandContent;
}

// ── POST /api/content/generate ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { theme, brief } = (await req.json()) as { theme?: string; brief?: string };
    if (!theme?.trim()) {
      return NextResponse.json({ error: "theme is required" }, { status: 400 });
    }

    const apiKey = process.env.PD_ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "PD_ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    const prompts: PromptEntry[] = JSON.parse(readFileSync(PROMPTS_PATH, "utf8"));
    const client = new Anthropic({ apiKey });

    const bands: Band[] = ["6-8", "9-12", "13-16"];
    const [b68, b912, b1316] = await Promise.all(
      bands.map(b => generateBand(client, theme, brief, b, prompts))
    );

    const dayContent = {
      theme,
      ...(brief ? { brief } : {}),
      "6-8":   b68,
      "9-12":  b912,
      "13-16": b1316,
    };

    return NextResponse.json(dayContent);
  } catch (e) {
    console.error("[generate]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
