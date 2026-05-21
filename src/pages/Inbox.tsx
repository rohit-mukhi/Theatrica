import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import '../styles/Inbox.css'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/connections`

interface ConvoItem {
  otherUser: string
  lastText: string
  lastTime: string
  unread: number
}

export default function Inbox() {
  const navigate = useNavigate()
  const { user, token, signOut } = useAuth()
  const [convos, setConvos] = useState<ConvoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' })
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!token) return
    async function load() {
      setLoading(true)
      try {
        const inboxRes = await fetch(`${API}/messages`, { headers: { 'Authorization': `Bearer ${token}` } })
        const { inbox: inboxData, unread: unreadByUser } = await inboxRes.json()

        const me = user?.username ?? ''
        const items: ConvoItem[] = (inboxData ?? []).map((entry: any) => {
          const msg = entry.lastMessage
          const otherUser = msg.from === me ? msg.to : msg.from
          return {
            otherUser,
            lastText: msg.text,
            lastTime: msg.createdAt,
            unread: (unreadByUser ?? {})[otherUser] ?? 0,
          }
        })
        // Sort: unread first, then by time
        items.sort((a, b) => {
          if (b.unread !== a.unread) return b.unread - a.unread
          return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
        })
        setConvos(items)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [token, user?.username])

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="home">
      <nav className="navbar" data-aos="fade-down">
        <a href="/" className="navbar-logo"><span>Theatrica</span></a>
        <ul className="navbar-links">
          <li><a href="/home">Browse</a></li>
          <li><a href="/matches">Matches</a></li>
        </ul>
        <div className="hamburger-wrapper" ref={dropdownRef}>
          <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span className={`ham-line${menuOpen ? ' open' : ''}`} />
            <span className={`ham-line${menuOpen ? ' open' : ''}`} />
            <span className={`ham-line${menuOpen ? ' open' : ''}`} />
          </button>
          {menuOpen && (
            <div className="hamburger-dropdown">
              <button onClick={() => { setMenuOpen(false); navigate('/profile') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                My Profile
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/inbox') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Messages
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/requests') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Friend Requests
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/matches') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                Matches
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/watchlist') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                Watchlist
              </button>
              <button className="signout" onClick={() => { setMenuOpen(false); signOut(); navigate('/') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="home-main">
        <section className="inbox-section">
          <p className="section-label" data-aos="fade-up">Direct Messages</p>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="100">Inbox</h2>

          {loading && <div className="home-status">Loading conversations...</div>}

          {!loading && convos.length === 0 && (
            <div className="profile-empty">
              <span className="profile-empty-icon">💬</span>
              <p>No conversations yet. Connect with someone and start chatting!</p>
              <button className="md-btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/matches')}>
                Find Matches
              </button>
            </div>
          )}

          {!loading && convos.length > 0 && (
            <div className="inbox-list" data-aos="fade-up" data-aos-delay="150">
              {convos.map((c, i) => (
                <div
                  key={c.otherUser}
                  className={`inbox-item${c.unread > 0 ? ' unread' : ''}`}
                  onClick={() => navigate(`/chat/${c.otherUser}`)}
                  data-aos="fade-up"
                  data-aos-delay={`${i * 40}`}
                >
                  <div className="inbox-avatar">{c.otherUser.charAt(0).toUpperCase()}</div>
                  <div className="inbox-body">
                    <div className="inbox-top">
                      <span className="inbox-username">@{c.otherUser}</span>
                      <span className="inbox-time">{formatTime(c.lastTime)}</span>
                    </div>
                    <div className="inbox-bottom">
                      <span className="inbox-preview">{c.lastText}</span>
                      {c.unread > 0 && <span className="inbox-badge">{c.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
