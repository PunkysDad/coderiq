import { useState } from 'react'
import FlashCard from './FlashCard'

export default function FlashCardDeck({ flashcards }) {
  const [index, setIndex] = useState(0)
  const [resetKey, setResetKey] = useState(0)

  const total = flashcards?.length ?? 0
  if (total === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-12">
        No flashcards in this set.
      </p>
    )
  }

  const safeIndex = Math.min(index, total - 1)
  const atFirst = safeIndex === 0
  const atLast = safeIndex === total - 1

  const handleReset = () => {
    setIndex(0)
    setResetKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <FlashCard
        key={`card-${safeIndex}-${resetKey}`}
        card={flashcards[safeIndex]}
        index={safeIndex}
      />
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={atFirst}
          className="px-4 py-2 text-sm rounded-lg border border-gray-800 text-gray-300 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-mono">
            Card {safeIndex + 1} of {total}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1 text-xs rounded-md border border-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-900 transition-colors"
          >
            Reset All
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={atLast}
          className="px-4 py-2 text-sm rounded-lg border border-gray-800 text-gray-300 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
