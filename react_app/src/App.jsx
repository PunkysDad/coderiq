import { useState } from 'react'
import { useAnalysis } from './hooks/useAnalysis'
import { useLearning } from './hooks/useLearning'
import ReportView from './components/ReportView'
import LearningCenter from './components/learning/LearningCenter'

export default function App() {
  const [tab, setTab] = useState('report')
  const analysis = useAnalysis()
  const learning = useLearning()

  const generatedAt =
    tab === 'report' ? formatTimestamp(analysis.data?.generated_at) : null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-6">
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
          {generatedAt && (
            <span className="text-xs text-gray-500 font-mono">
              {generatedAt}
            </span>
          )}
        </div>
      </header>

      <main>
        {tab === 'report' && (
          <ReportView data={analysis.data} status={analysis.status} />
        )}
        {tab === 'learning' && (
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
            <LearningCenter
              data={learning.data}
              status={learning.status}
            />
          </div>
        )}
      </main>
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
