import StatusScreen from './StatusScreen'
import GlobalSummary from './GlobalSummary'
import FileSection from './FileSection'

export default function ReportView({ data, status }) {
  if (status !== 'ready' || !data) {
    return <StatusScreen status={status} />
  }

  const files = data.files ?? []
  const conceptCount = files.reduce(
    (sum, f) => sum + (f.concepts?.length ?? 0),
    0,
  )

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-10">
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
    </div>
  )
}
