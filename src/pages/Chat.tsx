import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChatSocket, type ChatMessage } from '../hooks/useChatSocket'
import '../styles/Chat.css'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/connections`

export default function Chat() {
  const { username: otherUser } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { connected, messages, setMessages, typingFrom, sendMessage, sendTyping, setActiveConversation } = useChatSocket(token)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user || !otherUser) return
    setActiveConversation(otherUser)

    // Load history via REST
    fetch(`${API}/messages/${encodeURIComponent(otherUser)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMessages(data) })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => setActiveConversation(null)
  }, [otherUser, user])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingFrom])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !otherUser) return
    sendMessage(otherUser, input.trim())
    setInput('')
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value)
    if (!otherUser) return
    sendTyping(otherUser)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {}, 1500)
  }

  const myUsername = user?.username ?? ''

  function groupMessages(msgs: ChatMessage[]) {
    const groups: { sender: string; msgs: ChatMessage[] }[] = []
    for (const m of msgs) {
      const last = groups[groups.length - 1]
      if (last && last.sender === m.from) last.msgs.push(m)
      else groups.push({ sender: m.from, msgs: [m] })
    }
    return groups
  }

  const groups = groupMessages(messages)

  return (
    <div className="chat-page">
      {/* HEADER */}
      <header className="chat-header">
        <button className="chat-back" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="chat-header-info">
          <div className="chat-avatar">{otherUser?.charAt(0).toUpperCase()}</div>
          <div>
            <p className="chat-header-name">@{otherUser}</p>
            <p className="chat-header-status">{connected ? 'Connected' : 'Reconnecting...'}</p>
          </div>
        </div>
      </header>

      {/* MESSAGES */}
      <main className="chat-messages">
        {loading && <div className="chat-status">Loading messages...</div>}

        {!loading && messages.length === 0 && (
          <div className="chat-status">
            No messages yet. Say hello! 👋
          </div>
        )}

        {groups.map((group, gi) => {
          const isMine = group.sender === myUsername
          return (
            <div key={gi} className={`chat-group ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && (
                <div className="chat-bubble-avatar">{group.sender.charAt(0).toUpperCase()}</div>
              )}
              <div className="chat-bubbles">
                {group.msgs.map((m, mi) => (
                  <div key={m._id ?? mi} className="chat-bubble">
                    {m.text}
                  </div>
                ))}
                <span className="chat-time">
                  {new Date(group.msgs[group.msgs.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}

        {typingFrom === otherUser && (
          <div className="chat-group theirs">
            <div className="chat-bubble-avatar">{otherUser?.charAt(0).toUpperCase()}</div>
            <div className="chat-bubbles">
              <div className="chat-bubble chat-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* INPUT */}
      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          className="chat-input"
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          maxLength={500}
          autoFocus
        />
        <button type="submit" className="chat-send" disabled={!input.trim() || !connected}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  )
}
