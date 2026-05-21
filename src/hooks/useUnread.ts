import { useState, useEffect, useCallback } from 'react'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/connections`

export function useUnread(token: string | null) {
  const [total, setTotal] = useState(0)

  const fetch_ = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/messages/unread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setTotal(data.total ?? 0)
    } catch {}
  }, [token])

  useEffect(() => {
    fetch_()
    // Poll every 30s
    const id = setInterval(fetch_, 30000)
    return () => clearInterval(id)
  }, [fetch_])

  return { total, refresh: fetch_ }
}
