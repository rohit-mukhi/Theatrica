import { useState, useEffect, useCallback } from 'react'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/reviews`

export function useWatchlist(username: string | null) {
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!username) return
    setLoading(true)
    fetch(`${API}/watchlist/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => setWatchlist(data.watchlist ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [username])

  const toggle = useCallback(async (movieId: string) => {
    const token = localStorage.getItem('theatrica_token')
    if (!token) return
    const inList = watchlist.includes(movieId)

    // optimistic update
    setWatchlist(prev => inList ? prev.filter(id => id !== movieId) : [...prev, movieId])
    setToggling(prev => new Set(prev).add(movieId))

    try {
      if (inList) {
        await fetch(`${API}/watchlist/remove/${movieId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        })
      } else {
        await fetch(`${API}/watchlist/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ movieId }),
        })
      }
    } catch {
      // rollback on failure
      setWatchlist(prev => inList ? [...prev, movieId] : prev.filter(id => id !== movieId))
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(movieId); return s })
    }
  }, [watchlist])

  const isInWatchlist = useCallback((movieId: string) => watchlist.includes(movieId), [watchlist])

  return { watchlist, loading, toggling, toggle, isInWatchlist }
}
