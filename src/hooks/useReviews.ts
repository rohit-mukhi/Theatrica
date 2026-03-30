import { useEffect, useState, useCallback } from 'react'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/reviews`

export interface Review {
  _id: string
  movieId: string
  user: string
  review: string
  rating: number
}

export function useReviews(movieId: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!movieId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/movie/${movieId}`)
      if (!res.ok) throw new Error('Failed to fetch reviews')
      const data = await res.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [movieId])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  async function postReview(user: string, review: string, rating: number) {
    const token = localStorage.getItem('theatrica_token')
    const res = await fetch(`${API}/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ movieId, user, review, rating }),
    })
    if (!res.ok) throw new Error('Failed to submit review')
    await fetchReviews()
  }

  return { reviews, loading, error, postReview, refetch: fetchReviews }
}
