"use client";

import Link from "next/link";
import { useAccount, useConnect } from "wagmi";
import { useRouter } from "next/navigation";
import { AddressAvatar } from "@/components/AddressAvatar";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-8">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10 text-center lg:text-left">
            <span className="inline-block font-label text-[10px] tracking-[0.2em] uppercase text-secondary mb-6 bg-secondary/10 px-3 py-1 rounded-full">
              Hackathon Reputation Protocol
            </span>
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-8 leading-[1.1]">
              The Ultimate{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Builder Identity
              </span>{" "}
              Protocol
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
              Turn hackathon achievements into portable, verifiable credentials.
              Get peer attestations, earn awards, and build your onchain
              reputation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {mounted && isConnected ? (
                <button
                  onClick={() => router.push("/hackathon/0")}
                  className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(163,50,255,0.3)] transition-all"
                >
                  Enter Hackathon
                </button>
              ) : (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  disabled={isPending}
                  className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(163,50,255,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isPending && <div className="spinner !w-5 !h-5 border-[2.5px]" />}
                  {isPending ? "Connecting..." : "Get Started"}
                </button>
              )}
              <Link
                href="/hackathon/0"
                className="glass-card text-on-surface px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-variant/60 transition-all border border-outline-variant/20 text-center"
              >
                View Hackathon
              </Link>
            </div>
          </div>

          {/* Passport Preview */}
          <div className="relative hidden lg:block">
            <div className="glass-card aspect-square rounded-3xl overflow-hidden relative p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-6">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 overflow-hidden">
                    <AddressAvatar address="0x71C7656EC7ab88b098defB751B7401B5f6d8976F" size={64} />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl">
                      Builder_0x71...
                    </h3>
                    <p className="text-secondary text-xs font-label tracking-widest uppercase">
                      Hackathon Winner
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/5" role="status" aria-label="12 attestations received">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">
                      Attestations
                    </p>
                    <p className="font-headline font-bold text-primary">12</p>
                  </div>
                  <div className="bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/5" role="status" aria-label="Winner award received">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">
                      Awards
                    </p>
                    <p className="font-headline font-bold text-secondary">
                      Winner
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden" role="progressbar" aria-valuenow={78} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full w-[78%] bg-gradient-to-r from-primary to-secondary" />
                  </div>
                  <div className="flex justify-between text-[10px] font-label text-on-surface-variant">
                    <span>REPUTATION SCORE</span>
                    <span>78%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-surface-container-low py-20 px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <p className="font-headline text-5xl font-bold text-on-surface mb-2">
                Profiles
              </p>
              <p className="text-on-surface-variant font-label tracking-widest uppercase text-xs">
                Onchain builder identities
              </p>
            </div>
            <div>
              <p className="font-headline text-5xl font-bold text-primary mb-2">
                Attestations
              </p>
              <p className="text-on-surface-variant font-label tracking-widest uppercase text-xs">
                Peer-recognized contributions
              </p>
            </div>
            <div>
              <p className="font-headline text-5xl font-bold text-secondary mb-2">
                Awards
              </p>
              <p className="text-on-surface-variant font-label tracking-widest uppercase text-xs">
                Organizer-verified results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-32 px-8 max-w-7xl mx-auto">
        <div className="mb-20 text-center md:text-left">
          <p className="font-label text-primary text-[10px] tracking-[0.3em] uppercase mb-4">
            Core Architecture
          </p>
          <h2 className="font-headline text-4xl md:text-5xl font-bold">
            Protocol Pillars
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-surface-container rounded-3xl p-10 flex flex-col justify-between group hover:bg-surface-container-high transition-colors border border-outline-variant/10">
            <div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">
                  verified_user
                </span>
              </div>
              <h3 className="font-headline text-3xl font-bold mb-4">
                Verified History
              </h3>
              <p className="text-on-surface-variant text-lg max-w-lg">
                Every hackathon join, peer attestation, and organizer award is
                recorded onchain. Build a reputation that stays with you.
              </p>
            </div>
          </div>
          <div className="md:col-span-4 bg-surface-container-low rounded-3xl p-10 border border-outline-variant/5">
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-secondary text-3xl">
                diversity_3
              </span>
            </div>
            <h3 className="font-headline text-2xl font-bold mb-4">
              Peer Attestations
            </h3>
            <p className="text-on-surface-variant leading-relaxed">
              Recognize teammates across 5 categories: Technical, Product,
              Pitch, Helpful, and Teamwork.
            </p>
          </div>
          <div className="md:col-span-4 bg-surface-container-low rounded-3xl p-10 border border-outline-variant/5">
            <div className="w-14 h-14 bg-tertiary/10 rounded-2xl flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-tertiary text-3xl">
                military_tech
              </span>
            </div>
            <h3 className="font-headline text-2xl font-bold mb-4">
              Official Awards
            </h3>
            <p className="text-on-surface-variant leading-relaxed">
              Organizers assign Winner, Finalist, Honorable Mention, and Best
              Technical Solution awards.
            </p>
          </div>
          <div className="md:col-span-8 bg-surface-container rounded-3xl p-10 relative overflow-hidden group border border-outline-variant/10">
            <div className="relative z-10 h-full flex flex-col justify-center">
              <h3 className="font-headline text-3xl font-bold mb-4">
                One Profile. Every Hackathon.
              </h3>
              <p className="text-on-surface-variant text-lg max-w-md">
                Your Builder Passport is your portable credential across all
                hackathons. No more fragmented achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto glass-card rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
          <div className="relative z-10">
            <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6">
              Ready to Join?
            </h2>
            <p className="text-on-surface-variant text-lg mb-10 max-w-xl mx-auto">
              Connect your wallet and create your Builder Passport. Start
              building your hackathon legacy.
            </p>
            {mounted && isConnected ? (
              <button
                onClick={() => router.push("/hackathon/0")}
                className="bg-primary text-on-primary px-10 py-5 rounded-xl font-bold text-xl hover:scale-105 transition-transform"
              >
                Enter Hackathon
              </button>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                disabled={isPending}
                className="bg-primary text-on-primary px-10 py-5 rounded-xl font-bold text-xl hover:scale-105 transition-transform flex items-center justify-center gap-4 w-full max-w-sm mx-auto disabled:opacity-70 disabled:hover:scale-100"
              >
                {isPending && <div className="spinner !w-6 !h-6 border-[3px]" />}
                {isPending ? "Connecting..." : "Create Your Passport"}
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
