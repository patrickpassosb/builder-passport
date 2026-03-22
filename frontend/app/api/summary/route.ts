import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const CATEGORIES = ["Technical", "Product", "Pitch", "Helpful", "Teamwork"];
const AWARDS = ["None", "Finalist", "Winner", "Honorable Mention", "Best Technical Solution"];

export async function POST(req: NextRequest) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "MISTRAL_API_KEY not set" }, { status: 500 });
  }

  const { handle, displayName, attestations, award, hackathonName } = await req.json();

  const attestationLines = CATEGORIES.map(
    (cat, i) => `${cat}: ${attestations?.[i] ?? 0}`
  ).join(", ");

  const awardName = AWARDS[award ?? 0];

  const prompt = `You are writing a short, professional bio summary for a hackathon builder's passport page. Write 2-3 sentences max.

Builder: ${displayName || handle}
Hackathon: ${hackathonName || "Monad Blitz"}
Peer attestations: ${attestationLines}
Award: ${awardName}

Write a concise summary of this builder's hackathon reputation. Be specific about their strengths based on attestation counts. If they won an award, mention it. Keep it professional and energetic. Do not use emojis. Do not use hashtags.`;

  const client = new Mistral({ apiKey });
  const result = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 150,
  });

  const summary = result.choices?.[0]?.message?.content || "Builder on the rise.";

  return NextResponse.json({ summary });
}
