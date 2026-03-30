import { useEffect, useState } from 'react'
import type { Movie } from '../types'
export type { Movie }

// 16 well-known titles to seed the home page
const TITLES = [
  'Inception', 'Interstellar', 'The Dark Knight', 'Parasite',
  'Whiplash', 'The Godfather', 'Pulp Fiction', 'Fight Club',
  'Forrest Gump', 'The Matrix', 'Goodfellas', 'Schindler\'s List',
  'The Silence of the Lambs', 'Se7en', 'Memento', 'Arrival',
]

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const key = import.meta.env.VITE_OMDB_API_KEY
    if (!key || key === 'your_api_key_here') {
      setError('Add your OMDB API key to the .env file as VITE_OMDB_API_KEY')
      setLoading(false)
      return
    }

    async function fetchAll() {
      try {
        const results = await Promise.all(
          TITLES.map(t =>
            fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(t)}&apikey=${key}&plot=short`)
              .then(r => r.json())
          )
        )
        const valid = results.filter(m => m.Response === 'True') as Movie[]
        setMovies(valid)
      } catch {
        setError('Failed to fetch movies. Check your network or API key.')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  return { movies, loading, error }
}
