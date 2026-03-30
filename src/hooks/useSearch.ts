import { useState } from 'react'
import type { Movie } from '../types'

export function useSearch() {
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  async function search(term: string) {
    const key = import.meta.env.VITE_OMDB_API_KEY
    setQuery(term)
    if (!term.trim()) { setResults([]); return }
    setLoading(true)
    setError(null)
    try {
      // Search endpoint returns up to 10 results with basic info
      const res = await fetch(
        `https://www.omdbapi.com/?s=${encodeURIComponent(term)}&apikey=${key}&type=movie`
      )
      const data = await res.json()
      if (data.Response === 'True') {
        // Fetch full plot for each result
        const detailed = await Promise.all(
          (data.Search as any[]).map((m: any) =>
            fetch(`https://www.omdbapi.com/?i=${m.imdbID}&apikey=${key}&plot=short`)
              .then(r => r.json())
          )
        )
        setResults(detailed.filter((m, i, arr) => m.Response === 'True' && arr.findIndex(x => x.imdbID === m.imdbID) === i) as Movie[])
      } else {
        setResults([])
        setError(data.Error ?? 'No results found.')
      }
    } catch {
      setError('Search failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setResults([])
    setQuery('')
    setError(null)
  }

  return { results, loading, error, query, search, clear }
}
