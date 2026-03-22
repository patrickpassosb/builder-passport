"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useAccount,
  useConnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRIBUTION_CATEGORIES, AWARD_TYPES } from "@/lib/contract";

export default function HackathonPage() {
  const { id } = useParams<{ id: string }>();
  const hackathonId = BigInt(id ?? "0");
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // Profile form state
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Attestation state
  const [attestTarget, setAttestTarget] = useState("");
  const [attestCategory, setAttestCategory] = useState(0);

  // Award state
  const [awardTarget, setAwardTarget] = useState("");
  const [awardType, setAwardType] = useState(1);

  // Success modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Contract reads
  const { data: hackathon } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getHackathon",
    args: [hackathonId],
  });

  const { data: profile } = useReadContract({
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
      }
    );
  }

  function handleAttest() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "attestContribution",
        args: [hackathonId, attestTarget as `0x${string}`, attestCategory],
      },
      {
        onSuccess: () => {
          setSuccessMessage("Attestation confirmed!");
          setShowSuccess(true);
        },
      }
    );
  }

  function handleAward() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "assignAward",
        args: [hackathonId, awardTarget as `0x${string}`, awardType],
      },
      {
        onSuccess: () => {
          setSuccessMessage("Award assigned!");
          setShowSuccess(true);
        },
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
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div>
                    <span className="block text-on-surface-variant text-xs uppercase">
                      City
                    </span>
                    <span className="block font-headline font-medium">
                      {hackathonData?.city || "TBD"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-on-surface-variant text-xs uppercase">
                      Your Status
                    </span>
                    <span className="block font-headline font-medium">
                      {hasJoined ? "Joined" : "Not Joined"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-on-surface-variant text-xs uppercase">
                      Role
                    </span>
                    <span className="block font-headline font-medium">
                      {isOrganizer ? "Organizer" : "Builder"}
                    </span>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  {!profileExists && (
                    <span className="text-error text-sm">
                      Create a profile first (below)
                    </span>
                  )}
                  {profileExists && !hasJoined && (
                    <button
                      onClick={handleJoinHackathon}
                      disabled={isTxPending}
                      className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-lg font-bold text-lg hover:shadow-[0_0_20px_rgba(163,50,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isTxPending ? "Joining..." : "Join Hackathon"}
                    </button>
                  )}
                  {hasJoined && (
                    <span className="text-secondary font-bold text-lg flex items-center gap-2">
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
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
                  <span className="material-symbols-outlined text-primary">
                    person_add
                  </span>
                  <h2 className="text-2xl font-headline font-semibold text-on-surface">
                    Create Profile
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                      Handle *
                    </label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="e.g. patrick"
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Patrick Passos"
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Builder vibes..."
                      rows={2}
                      className="w-full bg-surface-container-lowest border-none text-on-surface p-4 rounded-md resize-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                        GitHub URL
                      </label>
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                        LinkedIn URL
                      </label>
                      <input
                        type="text"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateProfile}
                    disabled={!handle || isTxPending}
                    className="w-full bg-surface-bright text-on-surface font-headline font-bold py-4 rounded-md hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">
                      person_add
                    </span>
                    {isTxPending ? "Creating..." : "Create Profile"}
                  </button>
                </div>
              </div>
            )}

            {/* Attest Contribution (only if joined) */}
            {hasJoined && (
              <div className="bg-surface-container p-8 rounded-xl relative overflow-hidden monad-pulse">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-secondary">
                    diversity_3
                  </span>
                  <h2 className="text-2xl font-headline font-semibold text-on-surface">
                    Peer Attestation
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                      Participant Address
                    </label>
                    <input
                      type="text"
                      value={attestTarget}
                      onChange={(e) => setAttestTarget(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                      Category
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {CONTRIBUTION_CATEGORIES.map((cat, i) => (
                        <button
                          key={cat}
                          onClick={() => setAttestCategory(i)}
                          className={`p-3 rounded-md text-center text-xs font-bold font-label transition-all ${
                            attestCategory === i
                              ? "bg-primary/10 border border-primary text-primary"
                              : "bg-surface-container-low border border-outline-variant/10 text-on-surface hover:border-primary/50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAttest}
                    disabled={!attestTarget || isTxPending}
                    className="w-full bg-surface-bright text-on-surface font-headline font-bold py-4 rounded-md hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">verified</span>
                    {isTxPending ? "Attesting..." : "Submit Attestation"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Right Column */}
          <aside className="lg:col-span-5 space-y-8">
            {/* Organizer Award Panel (only for organizer) */}
            {isOrganizer && (
              <div className="bg-surface-container p-8 rounded-xl relative overflow-hidden monad-pulse">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary">
                    military_tech
                  </span>
                  <h2 className="text-2xl font-headline font-semibold text-on-surface">
                    Mark Award
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                      Builder Address
                    </label>
                    <input
                      type="text"
                      value={awardTarget}
                      onChange={(e) => setAwardTarget(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-label">
                      Award Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {AWARD_TYPES.slice(1).map((award, i) => (
                        <label key={award} className="cursor-pointer group">
                          <input
                            type="radio"
                            name="award"
                            className="hidden peer"
                            checked={awardType === i + 1}
                            onChange={() => setAwardType(i + 1)}
                          />
                          <div className="bg-surface-container-low border border-outline-variant/10 p-4 rounded-md text-center group-hover:border-primary/50 transition-all peer-checked:bg-primary/10 peer-checked:border-primary">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                              <span
                                className="material-symbols-outlined text-primary"
                                style={{
                                  fontVariationSettings: "'FILL' 1",
                                }}
                              >
                                workspace_premium
                              </span>
                            </div>
                            <span className="text-xs font-bold font-label text-on-surface block">
                              {award}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAward}
                    disabled={!awardTarget || isTxPending}
                    className="w-full bg-surface-bright text-on-surface font-headline font-bold py-4 rounded-md hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">verified</span>
                    {isTxPending ? "Assigning..." : "Confirm and Sign Award"}
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
                <span
                  className="material-symbols-outlined text-4xl text-secondary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <h3 className="text-3xl font-headline font-bold text-on-surface mb-2">
                {successMessage}
              </h3>
              <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
                Transaction confirmed onchain.
              </p>
              {txHash && (
                <div className="w-full bg-surface-container-lowest p-4 rounded-lg mb-8 text-left font-mono text-[0.7rem] text-secondary-container/80 space-y-1">
                  <div>TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}</div>
                  <div>STATUS: CONFIRMED</div>
                </div>
              )}
              <button
                onClick={() => {
                  setShowSuccess(false);
                  window.location.reload();
                }}
                className="w-full py-3 bg-surface-variant text-on-surface rounded-md font-headline font-bold hover:bg-surface-bright transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
