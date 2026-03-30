export default function AgentFlowDiagram() {
  const box =
    "flex flex-1 min-w-[5.5rem] flex-col items-center justify-center rounded-2xl border border-gray-200/90 bg-white/90 px-3 py-4 text-center shadow-sm sm:min-w-0 sm:px-5 sm:py-5";
  const label = "mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:text-[11px]";
  const title = "text-sm font-bold text-gray-900 sm:text-base";

  return (
    <div
      className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/90 via-white to-cyan-50/70 p-4 shadow-sm sm:mt-10 sm:p-6"
      aria-hidden
    >
      <p className="text-center text-xs font-medium text-indigo-700/90">How it works</p>
      <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className={box}>
          <span className={title}>Your agent</span>
          <span className={label}>LLM / orchestrator</span>
        </div>
        <div className="hidden shrink-0 text-indigo-400 sm:flex sm:text-2xl" aria-hidden>
          →
        </div>
        <div className="flex justify-center text-indigo-400 sm:hidden" aria-hidden>
          ↓
        </div>
        <div
          className={`${box} border-indigo-200/90 bg-gradient-to-br from-[#3953e6]/10 to-[#36aeea]/10 ring-2 ring-indigo-200/60`}
        >
          <span className={title}>Amply</span>
          <span className={`${label} text-indigo-600`}>~200ms class routing</span>
        </div>
        <div className="hidden shrink-0 text-indigo-400 sm:flex sm:text-2xl" aria-hidden>
          →
        </div>
        <div className="flex justify-center text-indigo-400 sm:hidden" aria-hidden>
          ↓
        </div>
        <div className={box}>
          <span className={title}>Best provider</span>
          <span className={label}>Vector + economics</span>
        </div>
      </div>
    </div>
  );
}
