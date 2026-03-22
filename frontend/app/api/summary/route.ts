import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const CATEGORIES = ["Technical", "Product", "Pitch", "Helpful", "Teamwork"];
const AWARDS = ["None", "Finalist", "Winner", "Honorable Mention", "Best Technical Solution"];

export async function POST(req: NextRequest) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "MISTRAL_API_KEY not set" }, { status: 500 });
  }

  const { handle, displayName, bio, hackathons, claims } = await req.json();

  // Build multi-hackathon summary
  const hackathonLines = (hackathons ?? [])
    .map((h: { name: string; attestations: number[]; award: number }) => {
      const cats = CATEGORIES.map(
        (cat, i) => `${cat}: ${h.attestations?.[i] ?? 0}`
      ).join(", ");
      return `- ${h.name}: ${cats}, Award: ${AWARDS[h.award ?? 0]}`;
    })
    .join("\n");

  const claimLines = (claims ?? [])
    .map(
      (c: { hackathonName: string; result: string; verifications: number }) =>
        `- ${c.hackathonName}: ${c.result} (${c.verifications} peer verifications)`
    )
    .join("\n");

  const totalHackathons = (hackathons ?? []).length;
  const totalAttestations = (hackathons ?? []).reduce(
    (sum: number, h: { attestations: number[] }) =>
      sum + (h.attestations ?? []).reduce((s: number, v: number) => s + (v ?? 0), 0),
    0
  );

  const prompt = `You are writing a short, professional bio summary for a hackathon builder's passport page. Write 2-3 sentences max.

Builder: ${displayName || handle}
Handle: @${handle}
${bio ? `Bio: ${bio}` : ""}
Total hackathons: ${totalHackathons}
Total attestations: ${totalAttestations}

Onchain hackathon history:
${hackathonLines || "No hackathons yet"}

External achievements (peer-verified claims):
${claimLines || "No external claims"}

Write a concise summary of this builder's hackathon reputation. Mention specific hackathons they participated in and their strengths based on attestation categories. If they have external claims with peer verifications, mention those as cross-platform credentials. If they have no activity yet, mention they recently joined and are building their onchain reputation. Keep it professional and energetic. Do not use emojis. Do not use hashtags.`;

  const client = new Mistral({ apiKey });
  const result = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 200,
  });

  const summary = result.choices?.[0]?.message?.content || "Builder on the rise.";

  return NextResponse.json({ summary });
}
