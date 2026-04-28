import ConceptCard from './ConceptCard'

export default function FileSection({ file }) {
  const concepts = file.concepts ?? []
  const conceptLabel = concepts.length === 1 ? 'concept' : 'concepts'

  return (
    <section className="border-t border-gray-800/60 pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
      <header className="mb-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="font-mono text-lg md:text-xl text-white">
            {file.filename}
          </h2>
          {file.language && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300">
              {file.language}
            </span>
          )}
          <span className="text-xs text-gray-500 ml-auto font-mono">
            {concepts.length} {conceptLabel}
          </span>
        </div>
        {file.summary && (
          <p className="text-gray-400 text-sm mt-2">{file.summary}</p>
        )}
      </header>
      <div className="space-y-3">
        {concepts.map((c, i) => (
          <ConceptCard key={`${c.name}-${i}`} concept={c} language={file.language} />
        ))}
      </div>
    </section>
  )
}
