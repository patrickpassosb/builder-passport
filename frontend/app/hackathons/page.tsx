"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useAccount,
  useConnect,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { type Address } from "viem";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "@/lib/contract";

interface HackathonEntry {
  id: number;
  name: string;
  city: string;
  organizer: string;
  active: boolean;
  participantCount: number;
}

export default function HackathonsPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const publicClient = usePublicClient();

  const [hackathons, setHackathons] = useState<HackathonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxPending, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  // Fetch all hackathons
  useEffect(() => {
    if (!publicClient) return;

    async function fetchHackathons() {
      setLoading(true);
      try {
        const nextId = (await publicClient!.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "nextHackathonId",
        })) as bigint;

        const count = Number(nextId);
        const results: HackathonEntry[] = [];

        for (let i = 0; i < count; i++) {
          try {
            const hackathon = (await publicClient!.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: "getHackathon",
              args: [BigInt(i)],
            })) as any;

            results.push({
              id: i,
              name: hackathon.name,
              city: hackathon.city,
              organizer: hackathon.organizer,
              active: hackathon.active,
              participantCount: 0,
            });
          } catch {
            // Skip hackathons that fail to load
          }
        }

        setHackathons(results);
      } catch {
        setHackathons([]);
      }
      setLoading(false);
    }

    fetchHackathons();
  }, [publicClient]);

  // Reload hackathons on successful transaction
  useEffect(() => {
    if (isTxSuccess && publicClient) {
      setShowSuccess(true);
      setName("");
      setCity("");

      // Re-fetch hackathons
      async function refetch() {
        try {
          const nextId = (await publicClient!.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "nextHackathonId",
          })) as bigint;

          const count = Number(nextId);
          const results: HackathonEntry[] = [];

          for (let i = 0; i < count; i++) {
            try {
              const hackathon = (await publicClient!.readContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: "getHackathon",
                args: [BigInt(i)],
              })) as any;

              results.push({
                id: i,
                name: hackathon.name,
                city: hackathon.city,
                organizer: hackathon.organizer,
                active: hackathon.active,
                participantCount: 0,
              });
            } catch {
              // Skip
            }
          }

          setHackathons(results);
        } catch {
          // Keep existing data
        }
      }

      refetch();
    }
  }, [isTxSuccess, publicClient]);

  // Auto-dismiss success
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Auto-dismiss errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  function handleCreateHackathon() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createHackathon",
        args: [name, city],
      },
      {
        onError: (err) => setError(err.message.split("\n")[0]),
      }
    );
  }

  function abbreviateAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <>
      <div className="pt-8 pb-20 px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-16 relative">
          <div className="absolute top-0 -left-20 w-72 h-72 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <span className="font-label text-[0.6875rem] uppercase tracking-widest text-primary font-bold mb-4 block">
              Directory
            </span>
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
              Hackathon{" "}
              <span className="text-primary-container">Directory</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl">
              Browse all hackathons on the Builder Passport protocol. Join
              existing events or create your own onchain hackathon.
            </p>
          </div>
        </section>

        {/* Create Hackathon Form */}
        {isConnected ? (
          <section className="mb-16">
            <div className="bg-surface-container p-8 rounded-xl relative overflow-hidden monad-pulse">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary">
                  add_circle
                </span>
                <h2 className="text-2xl font-headline font-semibold text-on-surface">
                  Create Hackathon
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
                    Hackathon Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Monad Blitz Berlin"
                    className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Berlin"
                    className="w-full bg-surface-container-lowest border-none text-on-surface py-4 px-4 rounded-md focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateHackathon}
                disabled={!name || !city || isTxPending}
                className="w-full md:w-auto bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold py-4 px-10 rounded-md hover:shadow-[0_0_20px_rgba(163,50,255,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTxPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      rocket_launch
                    </span>
                    Create Hackathon
                  </>
                )}
              </button>
            </div>
          </section>
        ) : (
          <section className="mb-16">
            <div className="bg-surface-container p-8 rounded-xl text-center">
              <p className="text-on-surface-variant mb-4">
                Connect your wallet to create a new hackathon.
              </p>
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold py-4 px-10 rounded-md hover:shadow-[0_0_20px_rgba(163,50,255,0.3)] transition-all"
              >
                Connect Wallet
              </button>
            </div>
          </section>
        )}

        {/* Hackathon List Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant block mb-1">
              All Hackathons
            </span>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              {loading ? "Loading..." : `${hackathons.length} Hackathon${hackathons.length !== 1 ? "s" : ""}`}
            </h2>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-surface-container rounded-xl p-8 space-y-4"
              >
                <div className="h-6 bg-surface-container-high rounded w-3/4" />
                <div className="h-4 bg-surface-container-high rounded w-1/2" />
                <div className="flex gap-3 mt-4">
                  <div className="h-6 bg-surface-container-high rounded-full w-20" />
                  <div className="h-6 bg-surface-container-high rounded-full w-24" />
                </div>
                <div className="h-4 bg-surface-container-high rounded w-2/3 mt-4" />
                <div className="h-10 bg-surface-container-high rounded-md mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && hackathons.length === 0 && (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-6 block">
              event_busy
            </span>
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">
              No Hackathons Yet
            </h3>
            <p className="text-on-surface-variant max-w-md mx-auto">
              Be the first to create a hackathon on Builder Passport. Connect
              your wallet and launch one above.
            </p>
          </div>
        )}

        {/* Hackathon Card Grid */}
        {!loading && hackathons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((hackathon) => (
              <div
                key={hackathon.id}
                className="bg-surface-container rounded-xl p-8 relative overflow-hidden monad-pulse group flex flex-col"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl -mr-12 -mt-12 pointer-events-none" />

                {/* Name */}
                <h3 className="font-headline text-xl font-bold text-on-surface mb-2 truncate relative z-10">
                  {hackathon.name}
                </h3>

                {/* City */}
                <p className="text-on-surface-variant text-sm mb-4 relative z-10">
                  {hackathon.city}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                  {/* Active / Inactive Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-bold uppercase tracking-tighter ${
                      hackathon.active
                        ? "bg-secondary/10 text-secondary"
                        : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hackathon.active
                          ? "bg-secondary shadow-[0_0_8px_rgba(230,254,255,0.8)]"
                          : "bg-on-surface-variant/40"
                      }`}
                    />
                    {hackathon.active ? "Active" : "Inactive"}
                  </span>

                  {/* Participant Count Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-bold uppercase tracking-tighter bg-primary/10 text-primary-fixed-dim">
                    {hackathon.participantCount} Builder
                    {hackathon.participantCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Organizer */}
                <div className="mb-6 relative z-10">
                  <span className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant block mb-1">
                    Organizer
                  </span>
                  <span className="text-on-surface text-sm font-mono">
                    {abbreviateAddress(hackathon.organizer)}
                  </span>
                </div>

                {/* View Link */}
                <div className="mt-auto relative z-10">
                  <Link
                    href={`/hackathon/${hackathon.id}`}
                    className="block w-full text-center bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-md hover:shadow-[0_0_20px_rgba(163,50,255,0.3)] transition-all active:scale-95"
                  >
                    View Hackathon
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/90 backdrop-blur-sm">
          <div className="bg-surface-container-high max-w-md w-full p-8 rounded-xl shadow-2xl border border-outline-variant/20 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-secondary-container to-transparent opacity-50" />
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary-container/10 flex items-center justify-center mb-6">
                <span
                  className="material-symbols-outlined text-4xl text-secondary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <h3 className="text-3xl font-headline font-bold text-on-surface mb-2">
                Hackathon Created!
              </h3>
              <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
                Your hackathon has been created onchain.
              </p>
              {txHash && (
                <div className="w-full bg-surface-container-lowest p-4 rounded-lg mb-8 text-left font-mono text-[0.7rem] text-secondary-container/80 space-y-1">
                  <div>
                    TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </div>
                  <div>STATUS: CONFIRMED</div>
                </div>
              )}
              <button
                onClick={() => setShowSuccess(false)}
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
            <button
              onClick={() => setError("")}
              className="material-symbols-outlined text-sm opacity-60 hover:opacity-100"
            >
              close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
