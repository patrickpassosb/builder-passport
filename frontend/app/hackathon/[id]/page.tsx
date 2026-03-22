"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useAccount,
  useConnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { type Address } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRIBUTION_CATEGORIES, AWARD_TYPES, EVENT_SIGNATURES, getEventLogs } from "@/lib/contract";
import { AddressAvatar } from "@/components/AddressAvatar";
import Link from "next/link";

interface Participant {
  address: Address;
  handle: string;
  displayName: string;
}

export default function HackathonPage() {
  const { id } = useParams<{ id: string }>();
  const hackathonId = BigInt(id ?? "0");
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const publicClient = usePublicClient();

  // Profile form state
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Attestation state
  const [attestTarget, setAttestTarget] = useState("");
  const [attestCategory, setAttestCategory] = useState(0);
  const [showCategoryFor, setShowCategoryFor] = useState<string | null>(null);

  // Award state
  const [awardTarget, setAwardTarget] = useState("");
  const [awardType, setAwardType] = useState(1);

  // UI state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Contract reads
  const { data: hackathon, isLoading: hackathonLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getHackathon",
    args: [hackathonId],
  });

  const { data: profile, isLoading: profileLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: hasJoinedRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasUserJoined",
    args: address ? [hackathonId, address] : undefined,
    query: { enabled: !!address },
  });
  const hasJoined = hasJoinedRaw as boolean | undefined;

  // Contract writes
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxPending } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const profileExists = (profile as any)?.exists === true;
  const hackathonData = hackathon as any;
  const isOrganizer = hackathonData?.organizer === address;

  // Fetch participants from JoinedHackathon events
  useEffect(() => {
    if (!publicClient || !hackathonData?.active) return;

    async function fetchParticipants() {
      setLoadingParticipants(true);
      try {
        const logs = await getEventLogs(
          publicClient!,
          CONTRACT_ADDRESS,
          EVENT_SIGNATURES.JoinedHackathon,
          { hackathonId }
        );

        const addresses = logs.map((log) => (log as any).args.participant as Address);
        const profileResults: Participant[] = [];

        for (const addr of addresses) {
          try {
            const p = await publicClient!.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: "getProfile",
              args: [addr],
            }) as any;

            if (p?.exists) {
              profileResults.push({
                address: addr,
                handle: p.handle,
                displayName: p.displayName || p.handle,
              });
            }
          } catch {}
        }

        setParticipants(profileResults);
      } catch {
        setParticipants([]);
      }
      setLoadingParticipants(false);
    }

    fetchParticipants();
  }, [publicClient, hackathonData?.active, hackathonId, hasJoined]);

  // Auto-dismiss errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  function showError(msg: string) {
    setError(msg);
  }

  function handleCreateProfile() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createProfile",
        args: [handle, displayName, bio, githubUrl, linkedinUrl],
      },
      {
        onSuccess: () => {
          setSuccessMessage("Profile created!");
          setShowSuccess(true);
        },
        onError: (err) => showError(err.message.split("\n")[0]),
      }
    );
  }

  function handleJoinHackathon() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "joinHackathon",
        args: [hackathonId],
      },
      {
        onSuccess: () => {
          setSuccessMessage("Joined hackathon!");
          setShowSuccess(true);
        },
        onError: (err) => showError(err.message.split("\n")[0]),
      }
    );
  }

  function handleAttest() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "attestContribution",
        args: [hackathonId, attestTarget as Address, attestCategory],
      },
      {
        onSuccess: () => {
          setSuccessMessage("Attestation confirmed!");
          setShowSuccess(true);
          setShowCategoryFor(null);
          setAttestTarget("");
        },
        onError: (err) => showError(err.message.split("\n")[0]),
      }
    );
  }

  function handleAward() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "assignAward",
        args: [hackathonId, awardTarget as Address, awardType],
      },
      {
        onSuccess: () => {
          setSuccessMessage("Award assigned!");
          setShowSuccess(true);
        },
        onError: (err) => showError(err.message.split("\n")[0]),
      }
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="font-headline text-4xl font-bold">Connect Wallet</h1>
          <p className="text-on-surface-variant">
            Connect your wallet to participate in the hackathon.
          </p>
          <button
            onClick={() => connect({ connector: connectors[0] })}
            className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-lg font-bold text-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (hackathonLoading || profileLoading) {
    return (
      <div className="pt-8 pb-20 px-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-surface-container-high rounded-lg w-1/2" />
          <div className="h-64 bg-surface-container rounded-xl" />
          <div className="grid grid-cols-2 gap-8">
            <div className="h-48 bg-surface-container rounded-xl" />
            <div className="h-48 bg-surface-container rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-8 pb-20 px-8 max-w-7xl mx-auto">
        {/* Hero */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <span className="font-label text-[0.6875rem] uppercase tracking-widest text-primary font-bold mb-4 block">
                Active Spotlight
              </span>
              <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
                {hackathonData?.name || "Monad Blitz"}{" "}
                <span className="text-primary-container">Hackathon</span>
              </h1>
              <p className="text-on-surface-variant text-lg max-w-2xl mb-8">
                {hackathonData?.city
                  ? `Join builders in ${hackathonData.city} for the ultimate hackathon experience on Monad.`
                  : "Build, attest, and earn awards onchain."}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col items-start lg:items-end pb-2">
              <div className="flex items-center gap-2 font-headline font-medium">
                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(230,254,255,0.8)]" />
                <span className="text-secondary">
                  {hackathonData?.active ? "LIVE" : "NOT FOUND"}
                </span>
              </div>
            </div>
          </div>

          {/* Featured Card */}
          <div className="relative group mt-8 overflow-hidden rounded-xl bg-surface-container border border-outline-variant/15 p-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 opacity-50" />
            <div className="relative flex flex-col md:flex-row gap-8 p-8 md:p-12 items-center bg-surface-container rounded-lg">
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[0.6875rem] font-bold text-secondary-fixed-dim uppercase tracking-tighter">
                    {hackathonData?.active ? "Running Now" : "Pending"}
                  </span>
                  <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[0.6875rem] font-bold text-primary-fixed-dim uppercase tracking-tighter">
                    {participants.length} Builder{participants.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div>
                    <span className="block text-on-surface-variant text-xs uppercase">City</span>
                    <span className="block font-headline font-medium">{hackathonData?.city || "TBD"}</span>
                  </div>
                  <div>
                    <span className="block text-on-surface-variant text-xs uppercase">Your Status</span>
                    <span className="block font-headline font-medium">{hasJoined ? "Joined" : "Not Joined"}</span>
                  </div>
                  <div>
                    <span className="block text-on-surface-variant text-xs uppercase">Role</span>
                    <span className="block font-headline font-medium">{isOrganizer ? "Organizer" : "Builder"}</span>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  {!profileExists && (
                    <span className="text-error text-sm">Create a profile first (below)</span>
                  )}
                  {profileExists && !hasJoined && (
                    <button
                      onClick={handleJoinHackathon}
                      disabled={isTxPending}
                      className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-lg font-bold text-lg hover:shadow-[0_0_20px_rgba(163,50,255,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTxPending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                          Joining...
                        </span>
                      ) : "Join Hackathon"}
                    </button>
                  )}
                  {hasJoined && (
                    <span className="text-secondary font-bold text-lg flex items-center gap-2">
                      <span className="material-symbols-outlined">check_circle</span>
                      You&apos;re in!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <section className="lg:col-span-7 space-y-8">
            {/* Create Profile */}
            {!profileExists && (
              <div className="bg-surface-container p-8 rounded-xl relative overflow-hidden monad-pulse">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary">person_add</span>
                  <h2 className="text-2xl font-headline font-semibold text-on-surface">Create Profile</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Handle *</label>
                    <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="e.g. patrick"
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Display Name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Patrick Passos"
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Builder vibes..." rows={2}
                      className="w-full bg-surface-container-lowest border-none text-on-surface p-4 rounded-md resize-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">GitHub URL</label>
                      <input type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">LinkedIn URL</label>
                      <input type="text" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                  <button onClick={handleCreateProfile} disabled={!handle || isTxPending}
                    className="w-full bg-surface-bright text-on-surface font-headline font-bold py-4 rounded-md hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isTxPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-on-surface/30 border-t-on-surface rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">person_add</span>
                        Create Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Peer Attestation with Participant List */}
            {hasJoined && (
              <div className="bg-surface-container p-8 rounded-xl relative overflow-hidden monad-pulse">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">diversity_3</span>
                    <h2 className="text-2xl font-headline font-semibold text-on-surface">Peer Attestation</h2>
                  </div>
                  <span className="text-sm text-on-surface-variant">
                    {participants.filter((p) => p.address !== address).length} peers
                  </span>
                </div>

                {/* Participant List */}
                <div className="space-y-3 mb-6">
                  {loadingParticipants ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
                          <div className="w-10 h-10 rounded-full bg-surface-container-highest" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-surface-container-highest rounded w-1/3" />
                            <div className="h-3 bg-surface-container-highest rounded w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : participants.filter((p) => p.address !== address).length === 0 ? (
                    <div className="text-center py-8 text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl mb-2 block">group_off</span>
                      <p className="text-sm">No other participants yet. Share the hackathon link!</p>
                    </div>
                  ) : (
                    participants
                      .filter((p) => p.address !== address)
                      .map((participant) => (
                        <div key={participant.address}>
                          <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors">
                            <Link href={`/passport/${participant.address}`} className="w-10 h-10 rounded-full overflow-hidden">
                              <AddressAvatar address={participant.address} size={40} />
                            </Link>
                            <Link href={`/passport/${participant.address}`} className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-on-surface truncate hover:text-primary transition-colors">
                                {participant.displayName}
                              </div>
                              <div className="text-[0.7rem] text-on-surface-variant uppercase tracking-tighter">
                                @{participant.handle}
                              </div>
                            </Link>
                            <button
                              onClick={() => {
                                setAttestTarget(participant.address);
                                setShowCategoryFor(
                                  showCategoryFor === participant.address ? null : participant.address
                                );
                              }}
                              className="text-primary text-sm font-label font-bold tracking-widest hover:underline"
                            >
                              ATTEST
                            </button>
                          </div>

                          {/* Category selector (inline) */}
                          {showCategoryFor === participant.address && (
                            <div className="mt-2 p-4 rounded-lg bg-surface-container-lowest space-y-3">
                              <div className="grid grid-cols-5 gap-2">
                                {CONTRIBUTION_CATEGORIES.map((cat, i) => (
                                  <button
                                    key={cat}
                                    onClick={() => setAttestCategory(i)}
                                    className={`p-2 rounded-md text-center text-[10px] font-bold font-label transition-all ${
                                      attestCategory === i
                                        ? "bg-primary/10 border border-primary text-primary"
                                        : "bg-surface-container border border-outline-variant/10 text-on-surface hover:border-primary/50"
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={handleAttest}
                                disabled={isTxPending}
                                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isTxPending ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                                    Attesting...
                                  </span>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    Attest {CONTRIBUTION_CATEGORIES[attestCategory]}
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right Column */}
          <aside className="lg:col-span-5 space-y-8">
            {/* Organizer Award Panel */}
            {isOrganizer && (
              <div className="bg-surface-container p-8 rounded-xl relative overflow-hidden monad-pulse">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary">military_tech</span>
                  <h2 className="text-2xl font-headline font-semibold text-on-surface">Mark Award</h2>
                </div>
                <div className="space-y-4">
                  {/* Participant selector for awards */}
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                      Select Builder
                    </label>
                    {participants.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {participants.map((p) => (
                          <button
                            key={p.address}
                            onClick={() => setAwardTarget(p.address)}
                            className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-all ${
                              awardTarget === p.address
                                ? "bg-primary/10 border border-primary"
                                : "bg-surface-container-low border border-outline-variant/10 hover:border-primary/50"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <AddressAvatar address={p.address} size={32} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{p.displayName}</div>
                              <div className="text-[10px] text-on-surface-variant">@{p.handle}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input type="text" value={awardTarget} onChange={(e) => setAwardTarget(e.target.value)} placeholder="0x..."
                        className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">Award Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {AWARD_TYPES.slice(1).map((award, i) => (
                        <label key={award} className="cursor-pointer group">
                          <input type="radio" name="award" className="hidden peer"
                            checked={awardType === i + 1} onChange={() => setAwardType(i + 1)} />
                          <div className="bg-surface-container-low border border-outline-variant/10 p-4 rounded-md text-center group-hover:border-primary/50 transition-all peer-checked:bg-primary/10 peer-checked:border-primary">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                workspace_premium
                              </span>
                            </div>
                            <span className="text-xs font-bold font-label text-on-surface block">{award}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleAward} disabled={!awardTarget || isTxPending}
                    className="w-full bg-surface-bright text-on-surface font-headline font-bold py-4 rounded-md hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isTxPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-on-surface/30 border-t-on-surface rounded-full animate-spin" />
                        Assigning...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">verified</span>
                        Confirm and Sign Award
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container p-6 rounded-xl">
                <div className="text-2xl font-headline font-bold text-primary tracking-tighter">
                  {hackathonData?.active ? "Active" : "--"}
                </div>
                <div className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-label">
                  Hackathon Status
                </div>
              </div>
              <div className="bg-surface-container p-6 rounded-xl">
                <div className="text-2xl font-headline font-bold text-secondary-container tracking-tighter">
                  Monad
                </div>
                <div className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-label">
                  Network
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/90 backdrop-blur-sm">
          <div className="bg-surface-container-high max-w-md w-full p-8 rounded-xl shadow-2xl border border-outline-variant/20 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-secondary-container to-transparent opacity-50" />
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary-container/10 flex items-center justify-center mb-6 relative">
                <span className="material-symbols-outlined text-4xl text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h3 className="text-3xl font-headline font-bold text-on-surface mb-2">{successMessage}</h3>
              <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">Transaction confirmed onchain.</p>
              {txHash && (
                <div className="w-full bg-surface-container-lowest p-4 rounded-lg mb-8 text-left font-mono text-[0.7rem] text-secondary-container/80 space-y-1">
                  <div>TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}</div>
                  <div>STATUS: CONFIRMED</div>
                </div>
              )}
              <button
                onClick={() => { setShowSuccess(false); window.location.reload(); }}
                className="w-full py-3 bg-surface-variant text-on-surface rounded-md font-headline font-bold hover:bg-surface-bright transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-full px-4">
          <div className="bg-error-container text-on-error-container p-4 rounded-xl shadow-2xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm flex-1">{error}</p>
            <button onClick={() => setError("")} className="material-symbols-outlined text-sm opacity-60 hover:opacity-100">close</button>
          </div>
        </div>
      )}
    </>
  );
}
