/** Text-only provider names — no third-party logos (trademark-friendly). */
const NAMES = ["Pinecone", "Qdrant", "Weaviate", "Chroma", "Supabase pgvector"];

export default function ProviderPills() {
  return (
    <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:mt-10">
      <span className="w-full text-center text-xs font-medium text-gray-500 sm:w-auto sm:pr-2">Catalog includes</span>
      {NAMES.map((name) => (
        <span
          key={name}
          className="inline-flex rounded-full border border-gray-200/90 bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm"
        >
          {name}
        </span>
      ))}
    </div>
  );
}
