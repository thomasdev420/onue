"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export default function ProviderJoinForm() {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [providerName, setProviderName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  const calendly = useMemo(
    () => process.env.NEXT_PUBLIC_CALENDLY_PROVIDER_URL?.trim() || "",
    [],
  );

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/provider-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          email,
          provider_name: providerName,
          tier_interest: "basic_listing",
          message,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || res.statusText);
      setStatus({ kind: "ok", detail: json.detail });
    } catch (e2) {
      setStatus({
        kind: "err",
        detail: e2 instanceof Error ? e2.message : "Request failed",
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <label className="block text-sm font-medium text-gray-800">Company</label>
        <input
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Work email</label>
        <input
          required
          type="email"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Provider / product name</label>
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="e.g. Acme Vector Cloud"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Notes (optional)</label>
        <textarea
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Regions, docs URL, metrics you want reflected…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={status?.kind === "loading"}
        className="w-full rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60"
      >
        {status?.kind === "loading" ? "Sending…" : "Submit listing request"}
      </button>
      {calendly && (
        <p className="text-center text-sm text-gray-600">
          Or{" "}
          <a href={calendly} className="font-medium text-indigo-600 underline" target="_blank" rel="noreferrer">
            book a 15‑min call
          </a>
          .
        </p>
      )}
      {status?.kind === "ok" && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{status.detail}</p>
      )}
      {status?.kind === "err" && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{status.detail}</p>
      )}
      <p className="text-center text-xs text-gray-500">
        <Link href="/providers" className="text-indigo-600 underline">
          Listing overview
        </Link>
        {" · "}
        <Link href="/pricing#providers" className="text-indigo-600 underline">
          Pricing
        </Link>
        {" · "}
        <Link href="/acceptable-use" className="text-indigo-600 underline">
          Acceptable use
        </Link>
      </p>
    </form>
  );
}
