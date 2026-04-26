import { Fragment, useState } from 'react'

export default function FillInTheBlank({ exercises }) {
  if (!exercises || exercises.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-12">
        No fill-in-the-blank exercises in this set.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {exercises.map((ex, i) => (
        <Exercise key={i} exercise={ex} index={i} />
      ))}
    </div>
  )
}

function Exercise({ exercise, index }) {
  const segments = (exercise.code ?? '').split('______')
  const blankCount = Math.max(0, segments.length - 1)
  const blanks = exercise.blanks ?? []

  const [answers, setAnswers] = useState(() => Array(blankCount).fill(''))
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState([])

  const handleCheck = () => {
    const r = answers.map((a, i) => a.trim() === (blanks[i] ?? ''))
    setResults(r)
    setChecked(true)
  }

  const handleReset = () => {
    setAnswers(Array(blankCount).fill(''))
    setResults([])
    setChecked(false)
  }

  const correctCount = results.filter(Boolean).length
  const allCorrect = checked && correctCount === blankCount

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
          Exercise {index + 1}
        </div>
        <p className="text-gray-100 text-base leading-relaxed">
          {exercise.instruction}
        </p>
      </div>

      <pre className="language-javascript text-sm overflow-x-auto">
        {segments.map((seg, i) => (
          <Fragment key={`s-${i}`}>
            {seg}
            {i < blankCount && (
              <BlankInput
                value={answers[i]}
                onChange={(v) => {
                  const next = [...answers]
                  next[i] = v
                  setAnswers(next)
                }}
                disabled={checked}
                state={
                  checked ? (results[i] ? 'correct' : 'wrong') : 'idle'
                }
              />
            )}
          </Fragment>
        ))}
      </pre>

      {checked && results.some((r) => !r) && (
        <div className="space-y-1">
          {results.map((ok, i) =>
            ok ? null : (
              <p key={i} className="text-xs text-gray-500">
                Blank {i + 1} answer:{' '}
                <span className="font-mono text-gray-300">{blanks[i]}</span>
              </p>
            ),
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {!checked ? (
          <button
            type="button"
            onClick={handleCheck}
            className="px-4 py-2 text-sm rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition-colors"
          >
            Check Answers
          </button>
        ) : (
          <span
            className={`text-sm font-medium ${
              allCorrect ? 'text-green-400' : 'text-gray-300'
            }`}
          >
            {allCorrect
              ? '✓ All correct'
              : `${correctCount} of ${blankCount} correct`}
          </span>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors"
        >
          Reset
        </button>
      </div>

      {checked && exercise.explanation && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
            Explanation
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            {exercise.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

function BlankInput({ value, onChange, disabled, state }) {
  let cls =
    'border-gray-700 bg-gray-800 text-gray-100 focus:border-violet-400'
  if (state === 'correct') {
    cls = 'border-green-500/60 bg-green-500/10 text-green-200'
  } else if (state === 'wrong') {
    cls = 'border-red-500/60 bg-red-500/10 text-red-200'
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      className={`inline-block mx-1 w-24 px-2 py-0.5 text-sm font-mono rounded border outline-none align-baseline ${cls}`}
    />
  )
}
