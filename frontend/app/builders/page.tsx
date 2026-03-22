"use client";

import { useState, useEffect } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { type Address } from "viem";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  CLAIMS_ADDRESS,
  CLAIMS_ABI,
  EVENT_SIGNATURES,
  getEventLogs,
  CONTRIBUTION_CATEGORIES,
  AWARD_TYPES,
  AWARD_WEIGHTS,
} from "@/lib/contract";
import { AddressAvatar } from "@/components/AddressAvatar";
import Link from "next/link";

interface BuilderEntry {
  address: Address;
  handle: string;
  displayName: string;
  totalAttestations: number;
  hackathonsJoined: number;
  bestAward: number;
  claimsCount: number;
  score: number;
}

export default function BuildersPage() {
  const publicClient = usePublicClient();
  const { address: connectedAddress } = useAccount();

  const [builders, setBuilders] = useState<BuilderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!publicClient) return;

    async function fetchBuilders() {
      setLoading(true);
      try {
        // 1. Fetch all ProfileCreated events to get registered addresses
        const profileLogs = await getEventLogs(
          publicClient!,
          CONTRACT_ADDRESS,
          EVENT_SIGNATURES.ProfileCreated
        );

        const addresses = profileLogs.map(
          (log) => (log as any).args.user as Address
        );

        const entries: BuilderEntry[] = [];

        for (const addr of addresses) {
          try {
            // 2a. Fetch profile
            const profile = (await publicClient!.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: "getProfile",
              args: [addr],
            })) as any;

            if (!profile?.exists) continue;

            // 2b. Find hackathons this address joined via direct reads
            const totalHackathons = (await publicClient!.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: "nextHackathonId",
            })) as bigint;

            const hackathonIds: bigint[] = [];
            for (let h = BigInt(0); h < totalHackathons; h++) {
              const joined = await publicClient!.readContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: "hasUserJoined",
                args: [h, addr],
              });
              if (joined) hackathonIds.push(h);
            }

            // 2c. For each hackathon, fetch attestation counts and award
            let totalAttestations = 0;
            let bestAward = 0;
            let totalAwardWeight = 0;

            for (const hackathonId of hackathonIds) {
              // Fetch attestation counts for all 5 categories
              for (let cat = 0; cat < CONTRIBUTION_CATEGORIES.length; cat++) {
                try {
                  const count = (await publicClient!.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: "getAttestationCount",
                    args: [hackathonId, addr, cat],
                  })) as number;
                  totalAttestations += Number(count);
                } catch {
                  // Skip on error
                }
              }

              // Fetch award for this hackathon
              try {
                const award = (await publicClient!.readContract({
                  address: CONTRACT_ADDRESS,
                  abi: CONTRACT_ABI,
                  functionName: "getAward",
                  args: [hackathonId, addr],
                })) as number;

                const awardNum = Number(award);
                totalAwardWeight += AWARD_WEIGHTS[awardNum] ?? 0;

                if (awardNum > bestAward) {
                  bestAward = awardNum;
                }
              } catch {
                // Skip on error
              }
            }

            // 2d. Fetch claims count from BuilderClaims contract
            let claimsCount = 0;
            try {
              const count = (await publicClient!.readContract({
                address: CLAIMS_ADDRESS,
                abi: CLAIMS_ABI,
                functionName: "getClaimCount",
                args: [addr],
              })) as number;
              claimsCount = Number(count);
            } catch {
              // Claims contract may not be deployed yet
            }

            // 3. Compute reputation score
            const score =
              totalAttestations * 10 +
              totalAwardWeight +
              claimsCount * 15;

            entries.push({
              address: addr,
              handle: profile.handle,
              displayName: profile.displayName || profile.handle,
              totalAttestations,
              hackathonsJoined: hackathonIds.length,
              bestAward,
              claimsCount,
              score,
            });
          } catch {
            // Skip builders whose data can't be fetched
          }
        }

        // 4. Sort by score descending
        entries.sort((a, b) => b.score - a.score);
        setBuilders(entries);
      } catch {
        // Handle RPC failures gracefully
        setBuilders([]);
      }
      setLoading(false);
    }

    fetchBuilders();
  }, [publicClient]);

  const filtered = builders.filter(
    (b) =>
      b.handle.toLowerCase().includes(search.toLowerCase()) ||
      b.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-8 pb-20 px-8 max-w-7xl mx-auto">
      {/* Hero */}
      <section className="mb-12 text-center">
        <span className="inline-block font-label text-[10px] tracking-[0.2em] uppercase text-secondary mb-4 bg-secondary/10 px-3 py-1 rounded-full">
          Onchain Reputation
        </span>
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface mb-4">
          Builder Leaderboard
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
          All registered builders ranked by onchain reputation score.
          Attestations, awards, and verified claims all contribute to the
          ranking.
        </p>
      </section>

      {/* Search */}
      <div className="mb-8 max-w-md mx-auto">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by handle or name..."
          className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-3">
        <div className="col-span-1">
          <span className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            #
          </span>
        </div>
        <div className="col-span-5">
          <span className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            Builder
          </span>
        </div>
        <div className="col-span-2 text-center">
          <span className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            Attestations
          </span>
        </div>
        <div className="col-span-2 text-center">
          <span className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            Best Award
          </span>
        </div>
        <div className="col-span-2 text-right">
          <span className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            Score
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-container rounded-xl p-6 animate-pulse"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <div className="h-8 w-8 bg-surface-container-high rounded" />
                </div>
                <div className="col-span-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-surface-container-high rounded w-1/3" />
                    <div className="h-3 bg-surface-container-high rounded w-1/4" />
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="h-6 w-10 bg-surface-container-high rounded" />
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="h-6 w-20 bg-surface-container-high rounded" />
                </div>
                <div className="col-span-2 flex justify-end">
                  <div className="h-8 w-16 bg-surface-container-high rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-outline mb-4 block">
            group_off
          </span>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
            {search ? "No builders found" : "No builders yet"}
          </h2>
          <p className="text-on-surface-variant">
            {search
              ? "Try a different search term."
              : "Be the first to create a Builder Passport and join a hackathon."}
          </p>
        </div>
      )}

      {/* Builder List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((builder, index) => {
            const rank =
              builders.findIndex((b) => b.address === builder.address) + 1;

            return (
              <Link
                key={builder.address}
                href={`/passport/${builder.address}`}
                className="block bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Rank */}
                  <div className="col-span-1">
                    <span className="font-headline text-2xl font-bold text-on-surface-variant/40">
                      {rank}
                    </span>
                  </div>

                  {/* Avatar + Name */}
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <AddressAvatar address={builder.address} size={48} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-headline font-bold text-on-surface truncate">
                        {builder.displayName}
                      </div>
                      <div className="text-[0.6875rem] text-on-surface-variant uppercase tracking-widest">
                        @{builder.handle}
                      </div>
                    </div>
                  </div>

                  {/* Attestations */}
                  <div className="col-span-2 text-center">
                    <span className="font-headline font-bold text-on-surface">
                      {builder.totalAttestations}
                    </span>
                    <span className="block md:hidden font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
                      Attestations
                    </span>
                  </div>

                  {/* Best Award */}
                  <div className="col-span-2 text-center">
                    <span className="text-secondary font-bold text-sm">
                      {AWARD_TYPES[builder.bestAward]}
                    </span>
                    <span className="block md:hidden font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
                      Award
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-right">
                    <span className="text-primary font-headline font-bold text-xl">
                      {builder.score}
                    </span>
                    <span className="block md:hidden font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
                      Score
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
