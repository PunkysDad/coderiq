const SESSION_URL = 'http://localhost:4000/api/sessions'

export default function HistorySidebar({
  sessions,
  loading,
  refetch,
  selectedSessionId,
  onSelect,
  onLive,
}) {
  const handleSelect = async (id) => {
    try {
      const res = await fetch(`${SESSION_URL}/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const session = await res.json()
      onSelect(session)
    } catch {
      // Selection failed — leave current view unchanged
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onLive}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            selectedSessionId === null
              ? 'text-violet-300 bg-violet-500/10'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          Live
        </button>
        <button
          type="button"
          onClick={refetch}
          aria-label="Refresh history"
          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded-md hover:bg-gray-900 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && sessions.length === 0 && (
          <p className="text-xs text-gray-500 font-mono px-4 py-6">Loading…</p>
        )}
        {!loading && sessions.length === 0 && (
          <p className="text-xs text-gray-500 px-4 py-6">No past sessions yet.</p>
        )}
        <ul className="py-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => handleSelect(s.id)}
                className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
                  selectedSessionId === s.id
                    ? 'border-violet-400 bg-violet-500/10'
                    : 'border-transparent hover:bg-gray-900/60'
                }`}
              >
                <div className="text-sm font-medium text-gray-100 truncate">
                  {s.title}
                </div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">
                  {formatDate(s.created_at)}
                </div>
                {s.source_files && s.source_files.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.source_files.slice(0, 4).map((f, i) => (
                      <span
                        key={`${f}-${i}`}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-400"
                      >
                        {f}
                      </span>
                    ))}
                    {s.source_files.length > 4 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 text-gray-500">
                        +{s.source_files.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
