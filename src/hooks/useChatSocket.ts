import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws')
  : 'ws://localhost:8000'

export interface ChatMessage {
  _id?: string
  from: string
  to: string
  text: string
  createdAt: string
  read: boolean
}

export function useChatSocket(token: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingFrom, setTypingFrom] = useState<string | null>(null)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeConvo = useRef<string | null>(null)

  const connect = useCallback(() => {
    if (!token) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'auth_ok') { setConnected(true); return }
      if (msg.type === 'auth_error') { ws.close(); return }

      if (msg.type === 'message') {
        const m: ChatMessage = msg.message
        // Only append if this message belongs to the active conversation
        if (activeConvo.current === m.from || activeConvo.current === m.to) {
          setMessages(prev => {
            // Deduplicate by _id
            if (prev.some(p => p._id === m._id)) return prev
            return [...prev, m]
          })
        } else {
          // It's from another conversation — increment unread
          setUnreadTotal(n => n + 1)
        }
      }

      if (msg.type === 'typing') {
        setTypingFrom(msg.from)
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTypingFrom(null), 2000)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      // Reconnect after 3s
      setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }, [token])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  function sendMessage(to: string, text: string) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', to, text }))
    }
  }

  function sendTyping(to: string) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', to }))
    }
  }

  function setActiveConversation(username: string | null) {
    activeConvo.current = username
    if (username) setMessages([]) // reset on open — history loaded via REST
  }

  return { connected, messages, setMessages, typingFrom, unreadTotal, setUnreadTotal, sendMessage, sendTyping, setActiveConversation }
}
