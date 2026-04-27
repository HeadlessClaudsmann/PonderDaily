import Anthropic from "@anthropic-ai/sdk";

export type AgeBand = "6-8" | "9-12" | "13-16";
export type TopicCategory =
  | "science"
  | "nature"
  | "history"
  | "technology"
  | "culture"
  | "human interest"
  | "geography"
  | "language";

const WORD_COUNTS: Record<AgeBand, string> = {
  "6-8": "120–150 words",
  "9-12": "180–220 words",
  "13-16": "220–280 words",
};

const TONE_NOTES: Record<AgeBand, string> = {
  "6-8": "Short, vivid, concrete. Animals, people, simple phenomena. Wonder-led. No complex vocabulary.",
  "9-12": "News-adjacent, real events, accessible complexity. Cause and effect, fairness, how things work.",
  "13-16": "Genuine complexity, contested ideas, ethics, society, science with implications. Discussion question arguable by a reasonable adult on either side.",
};

type GeneratedPiece = {
  title: string;
  body: string;
  question1: string;
  question2: string;
  question3: string;
};

export async function generateContentPiece(
  ageBand: AgeBand,
  topicCategory: TopicCategory
): Promise<GeneratedPiece> {
  const apiKey = process.env.PD_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("PD_ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey });

  const prompt = `You are generating content for Ponder Daily, a free educational website for curious kids aged 6–16.

Age band: ${ageBand}
Topic category: ${topicCategory}
Word count: ${WORD_COUNTS[ageBand]}
Tone: ${TONE_NOTES[ageBand]}

Write one short reading piece for this age band. Requirements:
- Grounded in a real phenomenon, event, or discovery
- News-adjacent but NOT distressing or politically partisan
- Warm, curious tone — written to spark wonder and thinking
- No cultural specificity that alienates non-US/UK audiences
- Nothing distressing for the age band

Follow with exactly three questions:
- Q1 (Recall): Tests whether they read and retained the piece
- Q2 (Inference): Requires reading between the lines — can't be answered from the text alone
- Q3 (Discussion): A genuinely open question — NO correct answer. A reasonable adult could argue either side. Must NOT have a hidden bias toward one answer.

Return ONLY valid JSON with these exact keys:
{
  "title": "",
  "body": "",
  "question1": "",
  "question2": "",
  "question3": ""
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system:
      "You are a children's educational content writer. Return only valid JSON, no markdown fences, no extra text.",
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown code fences if the model returns them despite instructions
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  const parsed = JSON.parse(text) as GeneratedPiece;

  if (
    !parsed.title ||
    !parsed.body ||
    !parsed.question1 ||
    !parsed.question2 ||
    !parsed.question3
  ) {
    throw new Error("Generated piece missing required fields");
  }

  return parsed;
}
