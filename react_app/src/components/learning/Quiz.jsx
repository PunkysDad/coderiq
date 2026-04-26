import { useState } from 'react'
import QuizQuestion from './QuizQuestion'

export default function Quiz({ questions }) {
  const [scores, setScores] = useState({})
  const [resetKey, setResetKey] = useState(0)

  if (!questions || questions.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-12">
        No quiz questions in this set.
      </p>
    )
  }

  const correct = Object.values(scores).filter(Boolean).length
  const answered = Object.keys(scores).length
  const remaining = questions.length - answered

  const handleAnswer = (qIndex, isCorrect) => {
    setScores((s) => ({ ...s, [qIndex]: isCorrect }))
  }

  const handleReset = () => {
    setScores({})
    setResetKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 sticky top-[57px] bg-gray-950/90 backdrop-blur py-3 -mx-6 px-6 md:-mx-10 md:px-10 border-b border-gray-800/60 z-[5]">
        <div className="text-sm text-gray-300 font-mono">
          <span className="text-violet-300">{correct}</span>
          <span className="text-gray-500"> / </span>
          <span>{questions.length}</span>
          <span className="text-gray-400"> answered correctly</span>
          {remaining > 0 && (
            <span className="text-gray-600 ml-3">
              ({remaining} remaining)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs px-3 py-1.5 rounded-md border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors"
        >
          Reset Quiz
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuizQuestion
            key={`q-${i}-${resetKey}`}
            question={q}
            index={i}
            onAnswer={(_choice, isCorrect) => handleAnswer(i, isCorrect)}
          />
        ))}
      </div>
    </div>
  )
}
