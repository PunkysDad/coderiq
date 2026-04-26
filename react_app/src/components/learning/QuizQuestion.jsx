import { useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'

export default function QuizQuestion({ question, index, onAnswer }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const answered = selectedIndex !== null

  const handleSelect = (i) => {
    if (answered) return
    setSelectedIndex(i)
    if (onAnswer) onAnswer(i, i === question.correct_index)
  }

  const highlightedSnippet = question.snippet
    ? Prism.highlight(
        question.snippet,
        Prism.languages.javascript,
        'javascript',
      )
    : null

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
          Question {index + 1}
        </div>
        <p className="text-gray-100 text-base leading-relaxed">
          {question.question}
        </p>
      </div>

      {highlightedSnippet && (
        <pre className="language-javascript text-sm overflow-x-auto">
          <code
            className="language-javascript"
            dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
          />
        </pre>
      )}

      <div className="space-y-2">
        {question.choices.map((choice, i) => {
          const isCorrect = i === question.correct_index
          const isSelected = i === selectedIndex
          let cls =
            'border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-200'
          if (answered) {
            if (isCorrect) {
              cls = 'border-green-500/40 bg-green-500/10 text-green-200'
            } else if (isSelected) {
              cls = 'border-red-500/40 bg-red-500/10 text-red-200'
            } else {
              cls = 'border-gray-800 bg-gray-900/40 text-gray-500'
            }
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${cls} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="font-mono text-xs text-gray-500 mr-3">
                {String.fromCharCode(65 + i)}.
              </span>
              {choice}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
            Explanation
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
