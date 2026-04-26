import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:4000/api/learning'
const POLL_MS = 2000

export function useLearning() {
  const [state, setState] = useState({ data: null, status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (cancelled) return

        if (
          json &&
          (Array.isArray(json.flashcards) ||
            Array.isArray(json.quiz) ||
            Array.isArray(json.fill_in_the_blank))
        ) {
          setState({ data: json, status: 'ready' })
        } else if (json && json.status === 'empty') {
          setState({ data: null, status: 'empty' })
        } else if (json && json.status === 'error') {
          setState({ data: null, status: 'error' })
        } else {
          setState({ data: null, status: 'empty' })
        }
      } catch {
        if (cancelled) return
        setState({ data: null, status: 'error' })
      }
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return state
}
