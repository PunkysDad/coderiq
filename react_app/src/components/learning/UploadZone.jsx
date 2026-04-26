import { useRef, useState } from 'react'

const UPLOAD_URL = 'http://localhost:4000/api/learning/upload'

export default function UploadZone({ onUploadSuccess }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState({ kind: 'idle', message: null })

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.name.toLowerCase().endsWith('.json')) {
      setStatus({ kind: 'error', message: 'Please select a .json file.' })
      return
    }

    setStatus({ kind: 'loading', message: 'Uploading...' })
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd })
      const json = await res.json()
      if (json.status === 'ok') {
        setStatus({
          kind: 'success',
          message: json.message || 'Upload successful.',
        })
        if (onUploadSuccess) onUploadSuccess()
      } else {
        setStatus({
          kind: 'error',
          message: json.message || 'Upload failed.',
        })
      }
    } catch (e) {
      setStatus({
        kind: 'error',
        message: `Network error: ${e.message}`,
      })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const isLoading = status.kind === 'loading'

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          isLoading ? 'cursor-wait' : 'cursor-pointer'
        } ${
          dragActive
            ? 'border-violet-400 bg-violet-500/10'
            : 'border-gray-700 bg-gray-900/30 hover:border-gray-600 hover:bg-gray-900/60'
        }`}
      >
        <p className="text-gray-200 text-base font-medium mb-1">
          Drop your CoderIQ learning file here
        </p>
        <p className="text-gray-500 text-sm">
          or click to browse — accepts .json files
        </p>
        {isLoading && (
          <p className="mt-4 text-violet-300 text-sm font-mono animate-pulse">
            {status.message}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {status.kind === 'success' && (
        <p className="text-center text-green-400 text-sm">{status.message}</p>
      )}
      {status.kind === 'error' && (
        <p className="text-center text-red-400 text-sm">{status.message}</p>
      )}
    </div>
  )
}
