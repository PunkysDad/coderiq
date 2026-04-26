import { useState } from 'react'
import FlashCardDeck from './FlashCardDeck'
import Quiz from './Quiz'
import FillInTheBlank from './FillInTheBlank'
import UploadZone from './UploadZone'

const LEARNING_URL = 'http://localhost:4000/api/learning'

export default function LearningCenter({ data, status }) {
  const [subTab, setSubTab] = useState('flashcards')

  if (status === 'loading') {
    return (
      <p className="text-gray-500 text-sm font-mono text-center py-12">
        Loading...
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="text-red-400 text-sm text-center py-12">
        Could not connect to CoderIQ API server. Is it running on port 4000?
      </p>
    )
  }

  if (status !== 'ready' || !data) {
    return (
      <div className="py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium text-white mb-2">
            Learning Center
          </h2>
          <p className="text-gray-500 text-sm">
            Upload a CoderIQ learning file to study with flashcards and quizzes.
          </p>
        </div>
        <UploadZone />
      </div>
    )
  }

  const flashcards = data.flashcards ?? []
  const quiz = data.quiz ?? []
  const fillInTheBlank = data.fill_in_the_blank ?? []
  const hasFlashcards = flashcards.length > 0
  const hasQuiz = quiz.length > 0
  const hasFillInTheBlank = fillInTheBlank.length > 0

  // Auto-fall-through: pick the first available tab if the active one has no content
  const availableTabs = []
  if (hasFlashcards) availableTabs.push('flashcards')
  if (hasQuiz) availableTabs.push('quiz')
  if (hasFillInTheBlank) availableTabs.push('fill_in_the_blank')
  const activeSubTab = availableTabs.includes(subTab)
    ? subTab
    : availableTabs[0]

  const handleClear = async () => {
    try {
      await fetch(LEARNING_URL, { method: 'DELETE' })
      // Polling hook will pick up the empty state on next tick.
    } catch {
      // Polling will surface a persistent error state if needed.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          {data.title && (
            <h2 className="text-2xl font-medium text-white">{data.title}</h2>
          )}
          {data.description && (
            <p className="text-gray-400 text-sm mt-1">{data.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors flex-shrink-0"
        >
          Clear & Upload New
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-800">
        {hasFlashcards && (
          <SubTab
            active={activeSubTab === 'flashcards'}
            onClick={() => setSubTab('flashcards')}
          >
            Flashcards
            <span className="ml-2 text-xs text-gray-500">
              {flashcards.length}
            </span>
          </SubTab>
        )}
        {hasQuiz && (
          <SubTab
            active={activeSubTab === 'quiz'}
            onClick={() => setSubTab('quiz')}
          >
            Quiz
            <span className="ml-2 text-xs text-gray-500">{quiz.length}</span>
          </SubTab>
        )}
        {hasFillInTheBlank && (
          <SubTab
            active={activeSubTab === 'fill_in_the_blank'}
            onClick={() => setSubTab('fill_in_the_blank')}
          >
            Fill in the Blank
            <span className="ml-2 text-xs text-gray-500">
              {fillInTheBlank.length}
            </span>
          </SubTab>
        )}
      </div>

      <div className="pt-2">
        {activeSubTab === 'flashcards' && hasFlashcards && (
          <FlashCardDeck flashcards={flashcards} />
        )}
        {activeSubTab === 'quiz' && hasQuiz && <Quiz questions={quiz} />}
        {activeSubTab === 'fill_in_the_blank' && hasFillInTheBlank && (
          <FillInTheBlank exercises={fillInTheBlank} />
        )}
      </div>
    </div>
  )
}

function SubTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'text-violet-300 border-violet-400'
          : 'text-gray-500 border-transparent hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}
