"use client";

import Link from "next/link";
import { PRICING_COLUMNS, PRICING_DISCLAIMER, PRICING_ROWS } from "@/app/lib/marketing/pricing";

/**
 * @param {{ showHeaderPrice?: boolean, className?: string }} props
 */
export default function PricingTable({ showHeaderPrice = true, className = "" }) {
  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/90">
              <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6"> </th>
              {PRICING_COLUMNS.map((c) => (
                <th key={c.key} className="px-4 py-4 font-semibold text-gray-900 sm:px-6">
                  <span className="block">{c.title}</span>
                  {showHeaderPrice ? (
                    <span className="mt-1 block text-xs font-normal text-indigo-600">{c.priceLine}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {PRICING_ROWS.map((row) => (
              <tr key={row.label} className="hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-medium text-gray-900 sm:px-6">{row.label}</td>
                <td className="px-4 py-3.5 sm:px-6">{row.free}</td>
                <td className="px-4 py-3.5 sm:px-6">{row.pro}</td>
                <td className="px-4 py-3.5 sm:px-6">{row.enterprise}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">{PRICING_DISCLAIMER}</p>
      <p className="mt-2 text-center text-xs text-gray-500">
        <Link href="/docs" className="font-medium text-indigo-600 underline">
          Documentation
        </Link>{" "}
        ·{" "}
        <Link href="/about" className="font-medium text-indigo-600 underline">
          Talk to us
        </Link>{" "}
        for Enterprise.
      </p>
    </div>
  );
}
