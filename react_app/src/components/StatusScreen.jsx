export default function StatusScreen({ status }) {
  const wrap = 'min-h-screen bg-gray-950 flex items-center justify-center px-6'

  if (status === 'loading') {
    return (
      <div className={wrap}>
        <div className="flex items-center gap-3 text-gray-400 font-mono text-sm">
          <span
            aria-hidden
            className="block w-2 h-2 rounded-full bg-violet-400 animate-pulse"
          />
          Waiting for CoderIQ analysis...
        </div>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className={wrap}>
        <div className="text-center max-w-md">
          <p className="text-gray-300 text-base mb-5">
            No analysis yet. Run CoderIQ from your terminal to get started.
          </p>
          <code className="inline-block bg-gray-900 border border-gray-800 px-3 py-2 rounded-md text-violet-300 font-mono text-sm">
            coderiq &lt;files&gt;
          </code>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={wrap}>
        <div className="text-center max-w-md">
          <p className="text-red-400 text-base mb-2 font-medium">
            Could not connect to CoderIQ API server.
          </p>
          <p className="text-red-300/70 text-sm">
            Is it running on port 4000?
          </p>
        </div>
      </div>
    )
  }

  return null
}
