import { useEffect, useRef, useState } from 'react'
import { useAnalysis } from './hooks/useAnalysis'
import { useLearning } from './hooks/useLearning'
import { useSessions } from './hooks/useSessions'
import ReportView from './components/ReportView'
import LearningCenter from './components/learning/LearningCenter'
import HistorySidebar from './components/HistorySidebar'

export default function App() {
  const [tab, setTab] = useState('report')
  const [selectedSession, setSelectedSession] = useState(null)
  const analysis = useAnalysis()
  const learning = useLearning()
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useSessions()

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    refetchSessions()
  }, [analysis.data?.generated_at, learning.data?.generated_at, refetchSessions])

  const adapted = adaptSession(selectedSession)
  const reportData = selectedSession ? adapted.analysis : analysis.data
  const reportStatus = selectedSession ? 'ready' : analysis.status
  const learningData = selectedSession ? adapted.learning : learning.data
  const learningStatus = selectedSession ? 'ready' : learning.status

  const generatedAt =
    tab === 'report' ? formatTimestamp(reportData?.generated_at) : null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur">
        <div className="px-6 md:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <span className="font-mono text-violet-300 font-medium tracking-tight text-sm">
              CoderIQ
            </span>
            <nav className="flex items-center gap-1">
              <TabButton
                active={tab === 'report'}
                onClick={() => setTab('report')}
              >
                Report
              </TabButton>
              <TabButton
                active={tab === 'learning'}
                onClick={() => setTab('learning')}
              >
                Learning Center
              </TabButton>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {selectedSession && (
              <span className="text-xs text-violet-300 font-mono">
                Viewing history: {selectedSession.title}
              </span>
            )}
            {generatedAt && (
              <span className="text-xs text-gray-500 font-mono">
                {generatedAt}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-72 flex-shrink-0 border-r border-gray-800/80 bg-gray-950 sticky top-16 self-start h-[calc(100vh-4rem)]">
          <HistorySidebar
            sessions={sessions}
            loading={sessionsLoading}
            refetch={refetchSessions}
            selectedSessionId={selectedSession?.id ?? null}
            onSelect={setSelectedSession}
            onLive={() => setSelectedSession(null)}
          />
        </aside>

        <main className="flex-1 min-w-0">
          {tab === 'report' && (
            <ReportView data={reportData} status={reportStatus} />
          )}
          {tab === 'learning' && (
            <div className="px-6 md:px-10 py-10">
              <LearningCenter data={learningData} status={learningStatus} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'text-violet-300 bg-violet-500/10'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function formatTimestamp(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function adaptSession(session) {
  if (!session) return { analysis: null, learning: null }

  const filesMap = new Map()
  for (const c of session.concepts ?? []) {
    if (!filesMap.has(c.filename)) {
      filesMap.set(c.filename, {
        filename: c.filename,
        language: c.language ?? '',
        concepts: [],
      })
    }
    let highlightLines = []
    try {
      const parsed = JSON.parse(c.highlight_lines ?? '[]')
      if (Array.isArray(parsed)) highlightLines = parsed
    } catch {
      // malformed JSON — treat as no highlights
    }
    filesMap.get(c.filename).concepts.push({
      name: c.name,
      category: c.category,
      difficulty: c.difficulty,
      what: c.what,
      why: c.why,
      snippet: c.snippet,
      highlight_lines: highlightLines,
    })
  }

  const analysis = {
    generated_at: session.created_at,
    files: Array.from(filesMap.values()),
  }

  const learning = {
    title: session.title,
    flashcards: session.flashcards ?? [],
    quiz: (session.quiz_questions ?? []).map((q) => ({
      question: q.question,
      snippet: q.snippet,
      choices: q.choices,
      correct_index: q.correct_index,
      explanation: q.explanation,
    })),
    fill_in_the_blank: (session.fill_in_the_blank ?? []).map((f) => ({
      instruction: f.instruction,
      code: f.code,
      blanks: f.blanks,
      explanation: f.explanation,
    })),
  }

  return { analysis, learning }
}
