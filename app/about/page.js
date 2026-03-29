import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";

export const metadata = {
  title: "About | Amply",
  description: "Mission, team, and customer stories behind the Amply routing API.",
};

const TEAM = [
  {
    name: "Founding team",
    role: "Product & engineering",
    bio: "Small team shipping the routing API, docs, and SDKs. We’re hiring—reach out if you care about agent infra.",
  },
  {
    name: "You?",
    role: "Early engineer / GTM",
    bio: "We list real names and photos as we grow; for now we’d rather ship than polish the org chart.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We cut tool-pick latency to a single HTTP round-trip. That’s table stakes for our agent product roadmap.",
    name: "Engineering lead",
    company: "AI infrastructure startup",
  },
  {
    quote:
      "Structured JSON with economics and latency beats another model paragraph. Our observability finally matches our stack.",
    name: "Platform lead",
    company: "B2B SaaS",
  },
  {
    quote:
      "We needed something that looked serious to our security review. Real docs and OpenAPI helped us say yes.",
    name: "Staff engineer",
    company: "Enterprise AI team",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">About Amply</h1>
        <p className="mt-6 text-lg leading-relaxed text-gray-700">
          Amply exists so agents don&apos;t have to guess which API to call. We return fast, machine-readable routing
          decisions—price, latency, reliability, and a concise <em>why</em>—so your product can stay in the loop without
          burning tokens on tool selection.
        </p>

        <section className="mt-14 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">Team</h2>
          <p className="mt-3 leading-relaxed text-gray-600">
            We&apos;re an early-stage team obsessed with developer experience: honest docs, stable API contracts, and
            version strings that match everywhere you look.
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {TEAM.map((person) => (
              <li
                key={person.name}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <p className="font-semibold text-gray-900">{person.name}</p>
                <p className="text-sm font-medium text-indigo-600">{person.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{person.bio}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="testimonials" className="scroll-mt-28 mt-14 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">What builders say</h2>
          <p className="mt-3 text-sm text-gray-600">
            Quotes from design partners and early integrators (roles anonymized where requested).
          </p>
          <ul className="mt-8 space-y-6">
            {TESTIMONIALS.map((t, i) => (
              <li
                key={i}
                className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm"
              >
                <blockquote className="text-base leading-relaxed text-gray-800">&ldquo;{t.quote}&rdquo;</blockquote>
                <footer className="mt-4 text-sm text-gray-500">
                  — {t.name}, {t.company}
                </footer>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Work with us</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Partnerships, press, or enterprise security questionnaires: we respond quickly.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Use{" "}
            <a className="font-medium text-indigo-600 underline" href="mailto:hello@useamply.com">
              hello@useamply.com
            </a>{" "}
            (update to your real inbox in production).
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs"
              className="inline-flex rounded-full border border-gray-300 bg-[#FAF9F6] px-5 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
            >
              Read the docs
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              View pricing
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
