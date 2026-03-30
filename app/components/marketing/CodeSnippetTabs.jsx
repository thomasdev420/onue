"use client";

import { useCallback, useMemo, useState } from "react";
import { HighlightBash } from "@/app/components/landing/CodeHighlight";
import { snippetCurl, snippetPython, snippetTypeScript, defaultBaseUrl } from "@/app/lib/marketing/routeCodeSnippets";
import { Check, Copy } from "lucide-react";

const TABS = [
  { id: "curl", label: "cURL" },
  { id: "ts", label: "TypeScript" },
  { id: "py", label: "Python" },
];

/**
 * @param {{ baseUrl?: string }} props — production default if not on client yet
 */
export default function CodeSnippetTabs({ baseUrl: baseUrlProp }) {
  const [tab, setTab] = useState("curl");
  const [copied, setCopied] = useState(false);

  const baseUrl = useMemo(() => defaultBaseUrl(typeof window !== "undefined" ? window.location.origin : baseUrlProp || ""), [baseUrlProp]);

  const code = useMemo(() => {
    if (tab === "curl") return snippetCurl(baseUrl);
    if (tab === "ts") return snippetTypeScript(baseUrl);
    return snippetPython(baseUrl);
  }, [tab, baseUrl]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [code]);

  return (
    <div className="relative rounded-xl border border-slate-600/90 bg-slate-950 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-700/90 px-2 py-2 sm:px-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              tab === t.id
                ? "bg-slate-800 text-white ring-1 ring-cyan-500/40"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onCopy}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-600/90 bg-slate-900/95 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/50"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-90" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="max-h-[min(50vh,400px)] overflow-x-auto overflow-y-auto p-4 sm:p-5">
        {tab === "curl" ? (
          <pre className="m-0 text-left font-mono text-[11px] leading-relaxed sm:text-[13px]">
            <HighlightBash code={code} />
          </pre>
        ) : (
          <pre className="m-0 whitespace-pre-wrap break-words text-left font-mono text-[11px] leading-relaxed text-slate-200 sm:text-[13px]">
            {code}
          </pre>
        )}
      </div>
      <p className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500 sm:px-5">
        Install:{" "}
        <code className="text-slate-400">npm install amply-sdk</code> ·{" "}
        <code className="text-slate-400">pip install amply-sdk</code> (see{" "}
        <a href="/docs/quickstart" className="text-cyan-400 underline">
          Quickstart
        </a>
        )
      </p>
    </div>
  );
}
