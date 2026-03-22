"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { type Address } from "viem";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  CONTRIBUTION_CATEGORIES,
  AWARD_TYPES,
} from "@/lib/contract";

export default function PassportPage() {
  const { address: rawAddress } = useParams<{ address: string }>();
  const userAddress = rawAddress as Address;

  const { data: profile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getProfile",
    args: [userAddress],
  });

  // Read attestation counts for hackathon 0
  const hackathonId = BigInt(0);
  const attestationReads = CONTRIBUTION_CATEGORIES.map((_, i) => {
    const { data } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getAttestationCount",
      args: [hackathonId, userAddress, i],
    });
    return data;
  });

  const { data: awardRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAward",
    args: [hackathonId, userAddress],
  });
  const award = awardRaw as number | undefined;

  const { data: hasJoinedRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasUserJoined",
    args: [hackathonId, userAddress],
  });
  const hasJoined = hasJoinedRaw as boolean | undefined;

  const p = profile as any;
  const awardIndex = Number(award ?? 0);
  const totalAttestations = attestationReads.reduce(
    (sum: number, val: unknown) => sum + Number(val ?? 0),
    0
  );

  // AI Summary
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!p?.exists || totalAttestations === 0 && awardIndex === 0) return;

    setSummaryLoading(true);
    fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: p.handle,
        displayName: p.displayName,
        attestations: attestationReads.map((v: unknown) => Number(v ?? 0)),
        award: awardIndex,
        hackathonName: "Monad Blitz",
      }),
    })
      .then((res) => res.json())
      .then((data) => setSummary(data.summary ?? ""))
      .catch(() => setSummary(""))
      .finally(() => setSummaryLoading(false));
  }, [p?.exists, totalAttestations, awardIndex]);

  if (!p?.exists) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-outline">
            person_off
          </span>
          <h1 className="font-headline text-3xl font-bold">
            Profile Not Found
          </h1>
          <p className="text-on-surface-variant">
            No Builder Passport exists for this address.
          </p>
          <p className="font-mono text-sm text-on-surface-variant/60">
            {userAddress}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-20 px-6 max-w-7xl mx-auto">
      {/* Hero Profile Section */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
          <div className="relative group">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-xl overflow-hidden bg-surface-container-high ring-2 ring-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-7xl">
                fingerprint
              </span>
            </div>
            {awardIndex > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                {AWARD_TYPES[awardIndex]}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <span className="font-label text-xs font-bold text-primary tracking-[0.2em] uppercase">
                Builder Profile
              </span>
              <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface">
                {p.displayName || p.handle}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg border-b border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-sm">
                  wallet
                </span>
                <span className="font-mono text-sm text-on-surface-variant">
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
              </div>
              <span className="bg-surface-container-highest text-on-surface px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                @{p.handle}
              </span>
            </div>
            {p.bio && (
              <p className="text-on-surface-variant text-lg max-w-2xl">
                {p.bio}
              </p>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {(summary || summaryLoading) && (
          <div className="mt-8 glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">
                auto_awesome
              </span>
              <span className="font-label text-xs font-bold text-primary tracking-[0.2em] uppercase">
                AI Summary
              </span>
            </div>
            {summaryLoading ? (
              <p className="text-on-surface-variant text-sm animate-pulse">
                Generating summary...
              </p>
            ) : (
              <p className="text-on-surface text-lg leading-relaxed">
                {summary}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-surface-container p-8 rounded-xl border-l-4 border-primary">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">
            Total Attestations
          </p>
          <h3 className="font-headline text-4xl font-bold text-on-surface">
            {totalAttestations}
          </h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all"
              style={{
                width: `${Math.min(totalAttestations * 10, 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="bg-surface-container p-8 rounded-xl border-l-4 border-secondary-container">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">
            Hackathons Joined
          </p>
          <h3 className="font-headline text-4xl font-bold text-on-surface">
            {hasJoined ? 1 : 0}
          </h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="bg-secondary-container h-full"
              style={{ width: hasJoined ? "100%" : "0%" }}
            />
          </div>
        </div>
        <div className="bg-surface-container p-8 rounded-xl border-l-4 border-tertiary">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">
            Award
          </p>
          <h3 className="font-headline text-4xl font-bold text-on-surface">
            {awardIndex > 0 ? AWARD_TYPES[awardIndex] : "None"}
          </h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="bg-tertiary h-full"
              style={{ width: awardIndex > 0 ? "100%" : "0%" }}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Attestation Breakdown */}
        <div className="lg:col-span-8 space-y-8">
          <h2 className="font-headline text-2xl font-bold flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              diversity_3
            </span>
            Attestation Breakdown
          </h2>
          <div className="space-y-4">
            {CONTRIBUTION_CATEGORIES.map((cat, i) => {
              const count = Number(attestationReads[i] ?? 0);
              return (
                <div
                  key={cat}
                  className="glass-card p-6 rounded-xl monad-pulse transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">
                          {
                            [
                              "code",
                              "inventory_2",
                              "campaign",
                              "volunteer_activism",
                              "group",
                            ][i]
                          }
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">{cat}</h4>
                        <p className="text-xs text-on-surface-variant">
                          Peer attestations received
                        </p>
                      </div>
                    </div>
                    <span className="font-headline text-2xl font-bold text-primary">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          {/* Award Badge */}
          {awardIndex > 0 && (
            <div>
              <h2 className="font-headline text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  award_star
                </span>
                Award
              </h2>
              <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center text-center gap-3 border-b border-primary/40">
                <span
                  className="material-symbols-outlined text-5xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  workspace_premium
                </span>
                <span className="text-sm font-bold uppercase tracking-tight text-on-surface">
                  {AWARD_TYPES[awardIndex]}
                </span>
                <span className="text-xs text-on-surface-variant">
                  Official organizer award
                </span>
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15">
            <h4 className="font-bold text-on-surface mb-4 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container text-lg">
                link
              </span>
              Links
            </h4>
            <div className="space-y-3">
              {p.githubUrl && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant">GitHub</span>
                  <a
                    href={p.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {p.githubUrl}
                  </a>
                </div>
              )}
              {p.linkedinUrl && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant">LinkedIn</span>
                  <a
                    href={p.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {p.linkedinUrl}
                  </a>
                </div>
              )}
              {!p.githubUrl && !p.linkedinUrl && (
                <p className="text-on-surface-variant text-xs">
                  No links provided
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
