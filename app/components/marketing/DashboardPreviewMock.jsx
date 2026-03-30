/**
 * Stylized UI preview (not a real screenshot) — shows dashboard affordances without implying live data.
 */
export default function DashboardPreviewMock() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.12em] text-gray-500">After sign-in</p>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg ring-1 ring-gray-900/[0.06]">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/90 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="text-xs font-semibold text-gray-700">Dashboard · API keys</span>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-3 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Active key</p>
            <p className="mt-1 font-mono text-xs text-gray-600">amply_live_••••••••••••••</p>
          </div>
          <div className="flex gap-2">
            <div className="h-8 flex-1 rounded-md bg-indigo-100/80" />
            <div className="h-8 w-24 rounded-md bg-gray-200/80" />
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            Create and rotate keys in the dashboard. Full key is shown once at creation.
          </p>
        </div>
      </div>
    </div>
  );
}
