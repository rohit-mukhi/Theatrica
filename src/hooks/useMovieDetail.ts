import { useEffect, useState } from 'react'

export interface MovieDetail {
  imdbID: string
  Title: string
  Poster: string
  Plot: string
  Year: string
  Genre: string
  Director: string
  Actors: string
  Runtime: string
  imdbRating: string
  Rated: string
  Language: string
}

export function useMovieDetail(imdbID: string) {
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!imdbID) return
    const key = import.meta.env.VITE_OMDB_API_KEY

    async function fetch_() {
      try {
        const res = await fetch(
          `https://www.omdbapi.com/?i=${imdbID}&apikey=${key}&plot=full`
        )
        const data = await res.json()
        if (data.Response === 'True') setMovie(data as MovieDetail)
        else setError('Movie not found.')
      } catch {
        setError('Failed to fetch movie details.')
      } finally {
        setLoading(false)
      }
    }

    fetch_()
  }, [imdbID])

  return { movie, loading, error }
}
