import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import '../styles/Profile.css'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/connections`

interface Request {
  _id: string
  from: string
  profilePic: string | null
  createdAt: string
}

export default function FriendRequests() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const token = localStorage.getItem('theatrica_token')

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
    fetch(`${API}/requests`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function accept(from: string) {
    setActing(from)
    await fetch(`${API}/accept/${encodeURIComponent(from)}`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
    })
    setRequests(prev => prev.filter(r => r.from !== from))
    setActing(null)
  }

  async function reject(from: string) {
    setActing(from)
    await fetch(`${API}/reject/${encodeURIComponent(from)}`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
    })
    setRequests(prev => prev.filter(r => r.from !== from))
    setActing(null)
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
        <section className="profile-section" style={{ maxWidth: 640 }}>
          <div className="userprofile-back" style={{ padding: '0 0 1.5rem' }}>
            <button className="search-back-btn" onClick={() => navigate(-1)}>← Back</button>
          </div>
          <p className="section-label" data-aos="fade-up">Inbox</p>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="100">Friend Requests</h2>

          {loading && <div className="home-status">Loading...</div>}

          {!loading && requests.length === 0 && (
            <div className="profile-empty">
              <span className="profile-empty-icon">💌</span>
              <p>No pending friend requests.</p>
            </div>
          )}

          {!loading && requests.map((r, i) => (
            <div key={r._id} className="fr-card" data-aos="fade-up" data-aos-delay={`${i * 60}`}>
              <div
                className="fr-avatar"
                onClick={() => navigate(`/user/${r.from}`)}
                style={{ cursor: 'pointer' }}
              >
                {r.profilePic
                  ? <img src={r.profilePic} alt={r.from} />
                  : r.from.charAt(0).toUpperCase()
                }
              </div>
              <div className="fr-info">
                <p className="fr-username" onClick={() => navigate(`/user/${r.from}`)} style={{ cursor: 'pointer' }}>
                  @{r.from}
                </p>
                <p className="fr-time">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="fr-actions">
                <button className="up-btn up-btn-primary" onClick={() => accept(r.from)} disabled={acting === r.from}>
                  {acting === r.from ? '...' : 'Accept'}
                </button>
                <button className="up-btn up-btn-ghost" onClick={() => reject(r.from)} disabled={acting === r.from}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  )
}
