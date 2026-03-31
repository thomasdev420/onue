"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";
import { amplyVersionLabel } from "@/app/lib/amplyProductVersion";

export default function MarketingNav() {
  const { data: session } = useSession();

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signIn("google", { callbackUrl: "/dashboard", redirect: true });
    } catch {
      window.location.href = "/dashboard";
    }
  }, []);

  const cta = useMemo(() => {
    if (session) {
      return (
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(57,83,230,0.35)] transition hover:scale-[1.02] hover:brightness-[1.03] active:scale-[0.98] sm:px-5"
        >
          Dashboard
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(57,83,230,0.35)] transition hover:scale-[1.02] hover:brightness-[1.03] active:scale-[0.98] sm:px-5"
      >
        get API key
      </button>
    );
  }, [session, handleGoogleSignIn]);

  const linkClass =
    "shrink-0 whitespace-nowrap py-2 transition hover:text-gray-900 touch-manipulation max-md:inline-flex max-md:min-h-[44px] max-md:items-center";
  const linkClassDesktop = "shrink-0 whitespace-nowrap transition hover:text-gray-900";

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-gray-200/90 bg-[#FAF9F6]/95 pt-safe shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-gray-900 transition hover:text-indigo-700 sm:text-xl"
        >
          Amply
        </Link>
        <nav
          className="mx-1 hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto py-1 text-sm font-medium text-gray-600 md:flex md:gap-6 lg:gap-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Primary"
        >
          <Link href="/#product" className={linkClassDesktop}>
            Product
          </Link>
          <Link href="/#use-cases" className={linkClassDesktop}>
            Use Cases
          </Link>
          <Link href="/docs" className={linkClassDesktop}>
            Docs
          </Link>
          <Link href="/#pricing" className={linkClassDesktop}>
            Pricing
          </Link>
          <Link href="/providers" className={linkClassDesktop}>
            For providers
          </Link>
          <Link href="/catalog" className={linkClassDesktop}>
            Catalog
          </Link>
          <Link href="/about" className={linkClassDesktop}>
            About
          </Link>
        </nav>
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <span
            className="hidden font-mono text-[10px] font-medium tabular-nums text-gray-400 lg:inline lg:text-[11px]"
            aria-label={`App ${amplyVersionLabel()}`}
          >
            {amplyVersionLabel()}
          </span>
          {cta}
        </div>
      </div>
      <div className="border-t border-gray-200/70 md:hidden">
        <nav
          className="mx-auto flex max-w-6xl snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain px-3 py-1 text-sm font-medium text-gray-600 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Primary sections"
        >
          <Link href="/#product" className={`${linkClass} snap-start`}>
            Product
          </Link>
          <Link href="/#use-cases" className={`${linkClass} snap-start`}>
            Use cases
          </Link>
          <Link href="/docs" className={`${linkClass} snap-start`}>
            Docs
          </Link>
          <Link href="/#pricing" className={`${linkClass} snap-start`}>
            Pricing
          </Link>
          <Link href="/providers" className={`${linkClass} snap-start`}>
            Providers
          </Link>
          <Link href="/catalog" className={`${linkClass} snap-start`}>
            Catalog
          </Link>
          <Link href="/about" className={`${linkClass} snap-start pr-3`}>
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
