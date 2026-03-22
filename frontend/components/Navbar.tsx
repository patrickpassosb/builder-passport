"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle client hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const navLinks = [
    { href: "/hackathon/0", label: "Hackathons", match: "/hackathon" },
    { href: `/passport/${mounted && address ? address : "0x"}`, label: "Passports", match: "/passport" },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#131314]/60 backdrop-blur-xl shadow-[0px_20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center w-full px-8 h-16 max-w-7xl mx-auto">
          <Link
            href="/"
            className="text-xl font-bold tracking-tighter text-primary font-headline relative z-[80]"
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
                    : "text-on-surface-variant hover:text-primary transition-colors monad-pulse"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              {mounted && isConnected ? (
                <button
                  onClick={() => disconnect()}
                  className="bg-surface-bright text-on-surface px-5 py-2 rounded-lg font-medium text-sm font-headline tracking-tight hover:bg-surface-container-highest transition-colors"
                >
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </button>
              ) : (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  disabled={isPending}
                  className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2 rounded-lg font-medium text-sm active:scale-95 transition-all font-headline tracking-tight flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isPending && <div className="spinner !w-4 !h-4" />}
                  {isPending ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
            </div>

            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-primary hover:bg-surface-variant/20 rounded-lg active:scale-95 transition-transform flex items-center relative z-[80]"
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-surface-variant/60 backdrop-blur-[20px] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-outline-variant/15 z-[70] transform transition-transform duration-300 ease-out flex flex-col pt-24 px-6 gap-8 md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-4 font-headline tracking-tight">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xl font-medium transition-colors px-4 py-3 rounded-xl border ${
                pathname.startsWith(link.match)
                  ? "text-primary bg-primary/10 border-primary/20"
                  : "text-on-surface hover:text-primary hover:bg-surface-container-high border-transparent"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-2 pt-6 border-t border-outline-variant/15 flex flex-col gap-4">
          {mounted && isConnected ? (
            <button
              onClick={() => disconnect()}
              className="bg-surface-bright text-on-surface px-5 py-4 rounded-xl font-medium text-base font-headline tracking-tight hover:bg-surface-container-highest transition-colors w-full text-center"
            >
              Disconnect {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-4 rounded-xl font-bold text-base active:scale-95 transition-all font-headline tracking-tight flex items-center justify-center gap-3 w-full disabled:opacity-70"
            >
              {isPending && <div className="spinner !w-5 !h-5" />}
              {isPending ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
