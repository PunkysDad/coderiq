export default function GlobalSummary({ summary, fileCount, conceptCount }) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-8 md:p-10">
      <div className="flex items-center gap-10 mb-6">
        <Stat
          value={fileCount}
          label={fileCount === 1 ? 'file' : 'files'}
        />
        <div className="h-10 w-px bg-gray-800" aria-hidden />
        <Stat
          value={conceptCount}
          label={conceptCount === 1 ? 'concept' : 'concepts'}
        />
      </div>
      {summary && (
        <p className="text-gray-300 text-base leading-relaxed">{summary}</p>
      )}
    </section>
  )
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-semibold text-white tabular-nums leading-none">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-2">
        {label}
      </div>
    </div>
  )
}
