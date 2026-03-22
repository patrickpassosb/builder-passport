"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();

  const navLinks = [
    { href: "/hackathon/0", label: "Hackathons", match: "/hackathon" },
    { href: `/passport/${address ?? "0x"}`, label: "Passports", match: "/passport" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#131314]/60 backdrop-blur-xl shadow-[0px_20px_40px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center w-full px-8 h-16 max-w-7xl mx-auto">
        <Link
          href="/"
          className="text-xl font-bold tracking-tighter text-primary font-headline"
        >
          Builder Passport
        </Link>

        <div className="hidden md:flex items-center gap-8 font-headline tracking-tight">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname.startsWith(link.match)
                  ? "text-primary border-b-2 border-primary-container pb-1"
                  : "text-on-surface-variant hover:text-primary transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        {isConnected ? (
          <button
            onClick={() => disconnect()}
            className="bg-surface-bright text-on-surface px-5 py-2 rounded-lg font-medium text-sm font-headline tracking-tight hover:bg-surface-container-highest transition-colors"
          >
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </button>
        ) : (
          <button
            onClick={() => connect({ connector: connectors[0] })}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2 rounded-lg font-medium text-sm active:scale-95 transition-transform font-headline tracking-tight"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
