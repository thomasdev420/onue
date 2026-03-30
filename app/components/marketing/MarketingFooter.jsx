import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

const linkClass =
  "block text-sm text-gray-600 transition-colors hover:text-gray-900";

const headingClass =
  "mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 sm:mb-4";

export default function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-transparent">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16 lg:pt-12">
        <div
          className="mb-10 h-0.5 w-full rounded-full bg-gradient-to-r from-stone-200/50 via-stone-500/85 to-stone-200/50 shadow-[0_1px_0_rgba(255,255,255,0.6)] lg:mb-12"
          aria-hidden
        />
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-8 xl:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight text-gray-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 text-white">
                <ArrowLeftRight className="h-4 w-4" aria-hidden strokeWidth={2.5} />
              </span>
              <span className="text-base">Amply</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              © {year} Amply. All rights reserved.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className={headingClass}>Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#api" className={linkClass}>
                  Routing API
                </Link>
              </li>
              <li>
                <Link href="/phase0-demo" className={linkClass}>
                  Phase 0 demo
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/for-providers" className={linkClass}>
                  For providers
                </Link>
              </li>
              <li>
                <Link href="/catalog" className={linkClass}>
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className={linkClass}>
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className={headingClass}>Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className={linkClass}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className={linkClass}>
                  Acceptable Use
                </Link>
              </li>
              <li>
                <Link href="/sla" className={linkClass}>
                  SLA
                </Link>
              </li>
              <li>
                <a href="mailto:support@useamply.com" className={linkClass}>
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h3 className={headingClass}>Developer</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className={linkClass}>
                  Documentation
                </Link>
              </li>
              <li>
                <a href="/api/v1/openapi" className={linkClass}>
                  API reference
                </a>
              </li>
              <li>
                <a href="/api/v1/status" className={linkClass}>
                  Status
                </a>
              </li>
              <li>
                <a href="/api/v1/openapi" className={linkClass}>
                  OpenAPI (JSON)
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <h3 className={headingClass}>Connect</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/thomasdev420/onue"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  X
                </a>
              </li>
              <li>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
