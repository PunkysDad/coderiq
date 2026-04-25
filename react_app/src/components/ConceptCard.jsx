import { useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'

const DIFFICULTY_STYLES = {
  Beginner: 'bg-green-500/15 text-green-300 border-green-500/30',
  Intermediate: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Advanced: 'bg-red-500/15 text-red-300 border-red-500/30',
}

const CATEGORY_STYLES =
  'bg-slate-500/15 text-slate-300 border-slate-500/30'

export default function ConceptCard({ concept }) {
  const [open, setOpen] = useState(false)

  const difficultyClass =
    DIFFICULTY_STYLES[concept.difficulty] ?? CATEGORY_STYLES

  const highlighted = concept.snippet
    ? Prism.highlight(
        concept.snippet,
        Prism.languages.javascript,
        'javascript',
      )
    : ''

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-900 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden
            className={`text-gray-500 text-xs transition-transform duration-200 inline-block ${
              open ? 'rotate-90' : ''
            }`}
          >
            ▸
          </span>
          <span className="text-white font-semibold text-base md:text-lg truncate">
            {concept.name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${difficultyClass}`}
          >
            {concept.difficulty}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${CATEGORY_STYLES}`}
          >
            {concept.category}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 space-y-4 border-t border-gray-800/60">
          <Section label="What is it?">{concept.what}</Section>
          <Section label="Why here?">{concept.why}</Section>
          {concept.snippet && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                Snippet
              </div>
              <pre className="language-javascript text-sm overflow-x-auto">
                <code
                  className="language-javascript"
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ label, children }) {
  if (!children) return null
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
        {label}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{children}</p>
    </div>
  )
}
