import { useAnalysis } from './hooks/useAnalysis'
import StatusScreen from './components/StatusScreen'
import GlobalSummary from './components/GlobalSummary'
import FileSection from './components/FileSection'

export default function App() {
  const { data, status } = useAnalysis()

  if (status !== 'ready' || !data) {
    return <StatusScreen status={status} />
  }

  const files = data.files ?? []
  const conceptCount = files.reduce(
    (sum, f) => sum + (f.concepts?.length ?? 0),
    0,
  )
  const generatedAt = formatTimestamp(data.generated_at)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <span className="font-mono text-violet-300 font-medium tracking-tight text-sm">
            CoderIQ
          </span>
          {generatedAt && (
            <span className="text-xs text-gray-500 font-mono">
              {generatedAt}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-10">
        <GlobalSummary
          summary={data.global_summary}
          fileCount={files.length}
          conceptCount={conceptCount}
        />
        <div>
          {files.map((f, i) => (
            <FileSection key={`${f.filename}-${i}`} file={f} />
          ))}
        </div>
      </main>
    </div>
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
