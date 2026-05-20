import { useState, useEffect, useCallback } from 'react'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/connections`

export type ConnectionStatus = 'none' | 'pending' | 'accepted' | 'blocked'
export type Direction = 'sent' | 'received' | null

interface StatusResult {
  status: ConnectionStatus
  direction: Direction
}

export function useConnection(myUsername: string | null, targetUsername: string | null) {
  const [status, setStatus] = useState<ConnectionStatus>('none')
  const [direction, setDirection] = useState<Direction>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)

  const token = () => localStorage.getItem('theatrica_token')

  const fetchStatus = useCallback(async () => {
    if (!myUsername || !targetUsername) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/status/${encodeURIComponent(targetUsername)}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      const data: StatusResult = await res.json()
      setStatus(data.status ?? 'none')
      setDirection(data.direction ?? null)
    } catch { }
    finally { setLoading(false) }
  }, [myUsername, targetUsername])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  async function sendRequest() {
    setActing(true)
    try {
      await fetch(`${API}/request/${encodeURIComponent(targetUsername!)}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }
      })
      setStatus('pending'); setDirection('sent')
    } catch { } finally { setActing(false) }
  }

  async function acceptRequest() {
    setActing(true)
    try {
      await fetch(`${API}/accept/${encodeURIComponent(targetUsername!)}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }
      })
      setStatus('accepted'); setDirection(null)
    } catch { } finally { setActing(false) }
  }

  async function rejectRequest() {
    setActing(true)
    try {
      await fetch(`${API}/reject/${encodeURIComponent(targetUsername!)}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }
      })
      setStatus('none'); setDirection(null)
    } catch { } finally { setActing(false) }
  }

  async function removeFriend() {
    setActing(true)
    try {
      await fetch(`${API}/friend/${encodeURIComponent(targetUsername!)}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token()}` }
      })
      setStatus('none'); setDirection(null)
    } catch { } finally { setActing(false) }
  }

  async function blockUser() {
    setActing(true)
    try {
      await fetch(`${API}/block/${encodeURIComponent(targetUsername!)}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }
      })
      setStatus('blocked'); setDirection(null)
    } catch { } finally { setActing(false) }
  }

  async function unblockUser() {
    setActing(true)
    try {
      await fetch(`${API}/unblock/${encodeURIComponent(targetUsername!)}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }
      })
      setStatus('none'); setDirection(null)
    } catch { } finally { setActing(false) }
  }

  return { status, direction, loading, acting, sendRequest, acceptRequest, rejectRequest, removeFriend, blockUser, unblockUser }
}
