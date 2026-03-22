"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { type Address } from "viem";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  CLAIMS_ADDRESS,
  CLAIMS_ABI,
  CONTRIBUTION_CATEGORIES,
  AWARD_TYPES,
} from "@/lib/contract";
import { AddressAvatar } from "@/components/AddressAvatar";
import Link from "next/link";

interface HackathonRecord {
  id: bigint;
  name: string;
  city: string;
  attestations: number[];
  award: number;
}

interface ClaimRecord {
  id: bigint;
  hackathonName: string;
  result: string;
  proofUrl: string;
  verifications: number;
}

const CATEGORY_ICONS = ["code", "inventory_2", "campaign", "volunteer_activism", "group"];

export default function PassportPage() {
  const { address: rawAddress } = useParams<{ address: string }>();
  const userAddress = rawAddress as Address;
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const isOwnProfile =
    connectedAddress?.toLowerCase() === userAddress?.toLowerCase();

  // Profile creation state
  const [handle, setHandle] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [githubUrlInput, setGithubUrlInput] = useState("");
  const [linkedinUrlInput, setLinkedinUrlInput] = useState("");

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editHandle, setEditHandle] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Claims form state
  const [claimHackathon, setClaimHackathon] = useState("");
  const [claimResult, setClaimResult] = useState("");
  const [claimProofUrl, setClaimProofUrl] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);

  // Multi-hackathon data
  const [hackathonRecords, setHackathonRecords] = useState<HackathonRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxPending, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  const { data: profile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getProfile",
    args: [userAddress],
  });

  const p = profile as any;

  // Fetch multi-hackathon data
  useEffect(() => {
    if (!publicClient || !p?.exists) {
      setLoadingData(false);
      return;
    }

    async function fetchData() {
      setLoadingData(true);
      try {
        // Get all hackathons this user joined by checking each hackathon directly
        // (avoids eth_getLogs which is limited to 100 blocks on Monad)
        const totalHackathons = (await publicClient!.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "nextHackathonId",
        })) as bigint;

        const hackathonIds: bigint[] = [];
        for (let i = BigInt(0); i < totalHackathons; i++) {
          const joined = await publicClient!.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "hasUserJoined",
            args: [i, userAddress],
          });
          if (joined) hackathonIds.push(i);
        }

        const records: HackathonRecord[] = [];

        for (const hId of hackathonIds) {
          const hackathon = (await publicClient!.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getHackathon",
            args: [hId],
          })) as any;

          const attestations: number[] = [];
          for (let cat = 0; cat < 5; cat++) {
            const count = await publicClient!.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: "getAttestationCount",
              args: [hId, userAddress, cat],
            });
            attestations.push(Number(count ?? 0));
          }

          const award = await publicClient!.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getAward",
            args: [hId, userAddress],
          });

          records.push({
            id: hId,
            name: hackathon.name,
            city: hackathon.city,
            attestations,
            award: Number(award ?? 0),
          });
        }

        setHackathonRecords(records);

        // Fetch claims
        try {
          const claimIds = (await publicClient!.readContract({
            address: CLAIMS_ADDRESS,
            abi: CLAIMS_ABI,
            functionName: "getBuilderClaimIds",
            args: [userAddress],
          })) as bigint[];

          const claimRecords: ClaimRecord[] = [];
          for (const cId of claimIds) {
            const claim = (await publicClient!.readContract({
              address: CLAIMS_ADDRESS,
              abi: CLAIMS_ABI,
              functionName: "getClaim",
              args: [cId],
            })) as any;

            claimRecords.push({
              id: cId,
              hackathonName: claim.hackathonName,
              result: claim.result,
              proofUrl: claim.proofUrl,
              verifications: Number(claim.verifications ?? 0),
            });
          }
          setClaims(claimRecords);
        } catch {
          // Claims contract may not be deployed yet
          setClaims([]);
        }
      } catch {
        setHackathonRecords([]);
        setClaims([]);
      }
      setLoadingData(false);
    }

    fetchData();
  }, [publicClient, p?.exists, userAddress, isTxSuccess]);

  // Aggregated stats
  const totalAttestations = hackathonRecords.reduce(
    (sum, h) => sum + h.attestations.reduce((a, b) => a + b, 0),
    0
  );
  const totalHackathons = hackathonRecords.length;
  const bestAward = hackathonRecords.length > 0
    ? Math.max(...hackathonRecords.map((h) => h.award))
    : 0;

  // Aggregated attestations per category (across all hackathons)
  const aggregatedAttestations = CONTRIBUTION_CATEGORIES.map((_, i) =>
    hackathonRecords.reduce((sum, h) => sum + (h.attestations[i] ?? 0), 0)
  );

  // AI Summary
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!p?.exists) return;

    setSummaryLoading(true);
    fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: p.handle,
        displayName: p.displayName,
        bio: p.bio,
        hackathons: hackathonRecords.map((h) => ({
          name: h.name,
          attestations: h.attestations,
          award: h.award,
        })),
        claims: claims.map((c) => ({
          hackathonName: c.hackathonName,
          result: c.result,
          verifications: c.verifications,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => setSummary(data.summary ?? ""))
      .catch(() => setSummary(""))
      .finally(() => setSummaryLoading(false));
  }, [p?.exists, totalAttestations, bestAward, claims.length]);

  // Pre-fill edit form when toggling edit mode
  useEffect(() => {
    if (isEditing && p?.exists) {
      setEditHandle(p.handle);
      setEditDisplayName(p.displayName);
      setEditBio(p.bio);
      setEditGithub(p.githubUrl);
      setEditLinkedin(p.linkedinUrl);
    }
  }, [isEditing]);

  function handleCreateProfile() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createProfile",
        args: [handle, displayNameInput, bioInput, githubUrlInput, linkedinUrlInput],
      },
      { onSuccess: () => window.location.reload() }
    );
  }

  function handleUpdateProfile() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "updateProfile",
        args: [editHandle, editDisplayName, editBio, editGithub, editLinkedin],
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          window.location.reload();
        },
      }
    );
  }

  function handleCreateClaim() {
    writeContract(
      {
        address: CLAIMS_ADDRESS,
        abi: CLAIMS_ABI,
        functionName: "createClaim",
        args: [claimHackathon, claimResult, claimProofUrl],
      },
      {
        onSuccess: () => {
          setClaimHackathon("");
          setClaimResult("");
          setClaimProofUrl("");
          setShowClaimForm(false);
          window.location.reload();
        },
      }
    );
  }

  function handleVerifyClaim(claimId: bigint) {
    writeContract({
      address: CLAIMS_ADDRESS,
      abi: CLAIMS_ABI,
      functionName: "verifyClaim",
      args: [claimId],
    });
  }

  if (!p?.exists) {
    // Own address with no profile → show create form
    if (isOwnProfile) {
      return (
        <div className="pt-8 pb-20 px-6 max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-28 h-28 mx-auto mb-6 rounded-xl overflow-hidden ring-2 ring-primary/20">
              <AddressAvatar address={userAddress} size={112} />
            </div>
            <span className="font-label text-xs font-bold text-primary tracking-[0.2em] uppercase">
              Create Your Passport
            </span>
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter mt-2">
              Welcome, Builder
            </h1>
            <p className="text-on-surface-variant mt-3 max-w-md mx-auto">
              Set up your onchain identity. This profile lives on Monad — no one can take it away.
            </p>
          </div>

          <div className="bg-surface-container p-8 rounded-xl space-y-5 monad-pulse">
            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Handle *</label>
              <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="e.g. patrick"
                className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Display Name</label>
              <input type="text" value={displayNameInput} onChange={(e) => setDisplayNameInput(e.target.value)} placeholder="Patrick Passos"
                className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Bio</label>
              <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} placeholder="Builder vibes..." rows={2}
                className="w-full bg-surface-container-lowest border-none text-on-surface p-4 rounded-md resize-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">GitHub URL</label>
                <input type="text" value={githubUrlInput} onChange={(e) => setGithubUrlInput(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">LinkedIn URL</label>
                <input type="text" value={linkedinUrlInput} onChange={(e) => setLinkedinUrlInput(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <button onClick={handleCreateProfile} disabled={!handle || isTxPending}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-md hover:shadow-[0_0_20px_rgba(163,50,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isTxPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined">person_add</span>
                  Create Builder Passport
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-outline">person_off</span>
          <h1 className="font-headline text-3xl font-bold">Profile Not Found</h1>
          <p className="text-on-surface-variant">No Builder Passport exists for this address.</p>
          <p className="font-mono text-sm text-on-surface-variant/60">{userAddress}</p>
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
              <AddressAvatar address={userAddress} size={176} />
            </div>
            {bestAward > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                {AWARD_TYPES[bestAward]}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <span className="font-label text-xs font-bold text-primary tracking-[0.2em] uppercase">
                Builder Profile
              </span>
              {isEditing ? (
                <div className="space-y-3">
                  <input type="text" value={editHandle} onChange={(e) => setEditHandle(e.target.value)}
                    className="w-full bg-surface-container-lowest border-none text-on-surface py-3 px-4 rounded-md focus:ring-1 focus:ring-primary font-headline text-2xl font-bold" />
                  <input type="text" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder="Display Name"
                    className="w-full bg-surface-container-lowest border-none text-on-surface py-3 px-4 rounded-md focus:ring-1 focus:ring-primary" />
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Bio" rows={2}
                    className="w-full bg-surface-container-lowest border-none text-on-surface p-4 rounded-md resize-none focus:ring-1 focus:ring-primary" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} placeholder="GitHub URL"
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-3 px-4 rounded-md focus:ring-1 focus:ring-primary text-sm" />
                    <input type="text" value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} placeholder="LinkedIn URL"
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-3 px-4 rounded-md focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleUpdateProfile} disabled={!editHandle || isTxPending}
                      className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-md font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {isTxPending ? (
                        <><span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                      ) : "Save Changes"}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="text-on-surface-variant hover:text-on-surface px-4 py-2 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface">
                    {p.displayName || p.handle}
                  </h1>
                </>
              )}
            </div>
            {!isEditing && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg border-b border-outline-variant/30">
                    <span className="material-symbols-outlined text-primary text-sm">wallet</span>
                    <span className="font-mono text-sm text-on-surface-variant">
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </span>
                  </div>
                  <span className="bg-surface-container-highest text-on-surface px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    @{p.handle}
                  </span>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    Share
                  </button>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit Profile
                    </button>
                  )}
                </div>
                {p.bio && (
                  <p className="text-on-surface-variant text-lg max-w-2xl">{p.bio}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {(summary || summaryLoading) && (
          <div className="mt-8 glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
              <span className="font-label text-xs font-bold text-primary tracking-[0.2em] uppercase">AI Summary</span>
            </div>
            {summaryLoading ? (
              <p className="text-on-surface-variant text-sm animate-pulse">Generating summary...</p>
            ) : (
              <p className="text-on-surface text-lg leading-relaxed">{summary}</p>
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
          <h3 className="font-headline text-4xl font-bold text-on-surface">{totalAttestations}</h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(totalAttestations * 10, 100)}%` }} />
          </div>
        </div>
        <div className="bg-surface-container p-8 rounded-xl border-l-4 border-secondary-container">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">
            Hackathons Joined
          </p>
          <h3 className="font-headline text-4xl font-bold text-on-surface">{totalHackathons}</h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="bg-secondary-container h-full" style={{ width: `${Math.min(totalHackathons * 25, 100)}%` }} />
          </div>
        </div>
        <div className="bg-surface-container p-8 rounded-xl border-l-4 border-tertiary">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2">
            Best Award
          </p>
          <h3 className="font-headline text-4xl font-bold text-on-surface">
            {bestAward > 0 ? AWARD_TYPES[bestAward] : "None"}
          </h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="bg-tertiary h-full" style={{ width: bestAward > 0 ? "100%" : "0%" }} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-12">
          {/* Attestation Breakdown (aggregated) */}
          <div>
            <h2 className="font-headline text-2xl font-bold flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">diversity_3</span>
              Attestation Breakdown
            </h2>
            <div className="space-y-4">
              {CONTRIBUTION_CATEGORIES.map((cat, i) => {
                const count = aggregatedAttestations[i];
                return (
                  <div key={cat} className="glass-card p-6 rounded-xl monad-pulse transition-all">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">{CATEGORY_ICONS[i]}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface">{cat}</h4>
                          <p className="text-xs text-on-surface-variant">Across all hackathons</p>
                        </div>
                      </div>
                      <span className="font-headline text-2xl font-bold text-primary">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hackathon History */}
          <div>
            <h2 className="font-headline text-2xl font-bold flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">history</span>
              Hackathon History
            </h2>
            {loadingData ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse bg-surface-container rounded-xl p-6 h-32" />
                ))}
              </div>
            ) : hackathonRecords.length === 0 ? (
              <div className="bg-surface-container rounded-xl p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 block">event_busy</span>
                <p className="text-on-surface-variant">No hackathon participation yet.</p>
                <Link href="/hackathons" className="text-primary text-sm hover:underline mt-2 inline-block">
                  Browse Hackathons
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {hackathonRecords.map((h) => (
                  <Link key={h.id.toString()} href={`/hackathon/${h.id.toString()}`}
                    className="block bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-colors monad-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-headline font-bold text-lg text-on-surface">{h.name}</h3>
                        <p className="text-sm text-on-surface-variant">{h.city}</p>
                      </div>
                      {h.award > 0 && (
                        <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                          {AWARD_TYPES[h.award]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {CONTRIBUTION_CATEGORIES.map((cat, i) => (
                        h.attestations[i] > 0 && (
                          <span key={cat} className="bg-surface-container-lowest px-3 py-1 rounded-full text-[11px] text-on-surface-variant">
                            {cat}: <span className="text-primary font-bold">{h.attestations[i]}</span>
                          </span>
                        )
                      ))}
                      {h.attestations.every((a) => a === 0) && (
                        <span className="text-[11px] text-on-surface-variant">No attestations yet</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* External Claims */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-2xl font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">verified</span>
                External Achievements
              </h2>
              {isOwnProfile && (
                <button
                  onClick={() => setShowClaimForm(!showClaimForm)}
                  className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">{showClaimForm ? "close" : "add"}</span>
                  {showClaimForm ? "Cancel" : "Add Achievement"}
                </button>
              )}
            </div>

            {/* Add claim form */}
            {showClaimForm && (
              <div className="bg-surface-container rounded-xl p-6 mb-6 space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Add a hackathon achievement from another platform. Peers can verify your claim.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Hackathon Name *</label>
                    <input type="text" value={claimHackathon} onChange={(e) => setClaimHackathon(e.target.value)} placeholder="ETHGlobal Istanbul 2023"
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-3 px-4 rounded-md focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Result *</label>
                    <input type="text" value={claimResult} onChange={(e) => setClaimResult(e.target.value)} placeholder="Winner"
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-3 px-4 rounded-md focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Proof URL</label>
                    <input type="text" value={claimProofUrl} onChange={(e) => setClaimProofUrl(e.target.value)} placeholder="https://devpost.com/..."
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-3 px-4 rounded-md focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                </div>
                <button onClick={handleCreateClaim} disabled={!claimHackathon || !claimResult || isTxPending}
                  className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-3 rounded-md font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {isTxPending ? (
                    <><span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">verified</span> Submit Claim</>
                  )}
                </button>
              </div>
            )}

            {claims.length === 0 && !showClaimForm ? (
              <div className="bg-surface-container rounded-xl p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 block">workspace_premium</span>
                <p className="text-on-surface-variant">No external achievements claimed yet.</p>
                {isOwnProfile && (
                  <p className="text-sm text-on-surface-variant mt-1">
                    Add your past hackathon wins and let peers verify them.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div key={claim.id.toString()} className="bg-surface-container rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary">emoji_events</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface text-sm">{claim.hackathonName}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] text-secondary font-bold uppercase">{claim.result}</span>
                        {claim.proofUrl && (
                          <a href={claim.proofUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                            Proof
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <span className="font-headline font-bold text-lg text-primary">{claim.verifications}</span>
                        <p className="text-[9px] text-on-surface-variant uppercase">Verified</p>
                      </div>
                      {!isOwnProfile && connectedAddress && (
                        <button
                          onClick={() => handleVerifyClaim(claim.id)}
                          disabled={isTxPending}
                          className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md text-[11px] font-bold transition-all disabled:opacity-50"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          {/* Award Badge */}
          {bestAward > 0 && (
            <div>
              <h2 className="font-headline text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">award_star</span>
                Best Award
              </h2>
              <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center text-center gap-3 border-b border-primary/40">
                <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
                <span className="text-sm font-bold uppercase tracking-tight text-on-surface">
                  {AWARD_TYPES[bestAward]}
                </span>
                <span className="text-xs text-on-surface-variant">Official organizer award</span>
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15">
            <h4 className="font-bold text-on-surface mb-4 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container text-lg">link</span>
              Links
            </h4>
            <div className="space-y-3">
              {p.githubUrl && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant">GitHub</span>
                  <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {p.githubUrl}
                  </a>
                </div>
              )}
              {p.linkedinUrl && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant">LinkedIn</span>
                  <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {p.linkedinUrl}
                  </a>
                </div>
              )}
              {!p.githubUrl && !p.linkedinUrl && (
                <p className="text-on-surface-variant text-xs">No links provided</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15">
            <h4 className="font-bold text-on-surface mb-4 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container text-lg">analytics</span>
              Composability
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This Builder Passport lives onchain on Monad. Any dApp, DAO, or protocol can read this reputation data
              to verify skills, gate access, or reward contributions. No company can revoke it.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="bg-surface-container px-2 py-1 rounded text-[9px] font-bold text-on-surface-variant uppercase">Monad Testnet</span>
              <span className="bg-surface-container px-2 py-1 rounded text-[9px] font-bold text-on-surface-variant uppercase">EVM Compatible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal (YouTube-style) */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          onClick={() => { setShowShareModal(false); setCopied(false); }}
        >
          <div
            className="bg-surface-container-high max-w-md w-full rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h3 className="font-headline text-lg font-bold text-on-surface">Share</h3>
              <button
                onClick={() => { setShowShareModal(false); setCopied(false); }}
                className="w-8 h-8 rounded-full hover:bg-surface-container-highest flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
              </button>
            </div>

            {/* Social buttons */}
            <div className="px-6 pb-5">
              <div className="flex justify-center gap-5 mb-6">
                {[
                  {
                    name: "X",
                    icon: "X",
                    color: "bg-white/10 hover:bg-white/20 text-white",
                    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Check out ${p.displayName || p.handle}'s Builder Passport on Monad!\n\nOnchain reputation, peer attestations, and hackathon awards — all composable.\n\n`
                    )}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`,
                  },
                  {
                    name: "Telegram",
                    icon: "T",
                    color: "bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE]",
                    href: `https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(
                      `Check out ${p.displayName || p.handle}'s Builder Passport on Monad!`
                    )}`,
                  },
                  {
                    name: "WhatsApp",
                    icon: "W",
                    color: "bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366]",
                    href: `https://wa.me/?text=${encodeURIComponent(
                      `Check out ${p.displayName || p.handle}'s Builder Passport on Monad! ${typeof window !== "undefined" ? window.location.href : ""}`
                    )}`,
                  },
                  {
                    name: "LinkedIn",
                    icon: "in",
                    color: "bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2]",
                    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`,
                  },
                  {
                    name: "Email",
                    icon: "mail",
                    color: "bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant",
                    href: `mailto:?subject=${encodeURIComponent(
                      `${p.displayName || p.handle}'s Builder Passport`
                    )}&body=${encodeURIComponent(
                      `Check out this Builder Passport on Monad:\n\n${typeof window !== "undefined" ? window.location.href : ""}`
                    )}`,
                  },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${social.color}`}>
                      {social.icon === "mail" ? (
                        <span className="material-symbols-outlined text-lg">mail</span>
                      ) : (
                        <span className="font-headline font-bold text-sm">{social.icon}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-label">{social.name}</span>
                  </a>
                ))}
              </div>

              {/* URL copy field */}
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg p-1.5 border border-outline-variant/10">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  className="flex-1 bg-transparent border-none text-on-surface-variant text-xs px-3 py-2 outline-none font-mono truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-4 py-2 rounded-md text-xs font-bold font-headline transition-all shrink-0 ${
                    copied
                      ? "bg-secondary/20 text-secondary"
                      : "bg-primary/10 hover:bg-primary/20 text-primary"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
