import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useUnread } from '../hooks/useUnread'
import '../styles/Matches.css'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/reviews`
const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY

interface Match {
  username: string
  profilePic: string | null
  score: number
  sharedMovies: number
  topSharedMovieId: string
  topSharedMovieTitle?: string
  topSharedMoviePoster?: string
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  const navigate = useNavigate()
  const scoreColor = match.score >= 75 ? 'var(--gold)' : match.score >= 50 ? '#a0c4a0' : 'var(--text-muted)'

  return (
    <div
      className="match-card"
      data-aos="fade-up"
      data-aos-delay={`${(index % 3) * 80}`}
      onClick={() => navigate(`/user/${match.username}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="match-poster-wrap">
        {match.topSharedMoviePoster
          ? <img src={match.topSharedMoviePoster} alt={match.topSharedMovieTitle} className="match-poster" />
          : <div className="match-poster-placeholder">🎬</div>
        }
        <div className="match-score-badge" style={{ color: scoreColor }}>
          {match.score}%
        </div>
      </div>

      <div className="match-info">
        <div className="match-avatar">
          {match.profilePic
            ? <img src={match.profilePic} alt={match.username} />
            : match.username.charAt(0).toUpperCase()
          }
        </div>
        <div className="match-meta">
          <p className="match-username">@{match.username}</p>
          <p className="match-shared">{match.sharedMovies} movies in common</p>
        </div>
      </div>

      {match.topSharedMovieTitle && (
        <div className="match-top-film">
          <span className="match-top-film-label">Top shared film</span>
          <span className="match-top-film-title">{match.topSharedMovieTitle}</span>
        </div>
      )}
    </div>
  )
}

export default function Matches() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { total: unreadCount } = useUnread(localStorage.getItem('theatrica_token'))
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    if (!user?.username) return
    async function fetchMatches() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API}/matches/${encodeURIComponent(user!.username!)}`)
        const data = await res.json()
        if (!Array.isArray(data)) { setError('Failed to load matches.'); return }

        // Enrich top shared movie with OMDB title + poster
        const enriched = await Promise.all(
          data.map(async (m: Match) => {
            try {
              const omdb = await fetch(`https://www.omdbapi.com/?i=${m.topSharedMovieId}&apikey=${OMDB_KEY}`)
              const movie = await omdb.json()
              return {
                ...m,
                topSharedMovieTitle: movie.Response === 'True' ? movie.Title : undefined,
                topSharedMoviePoster: movie.Response === 'True' && movie.Poster !== 'N/A' ? movie.Poster : undefined,
              }
            } catch {
              return m
            }
          })
        )
        setMatches(enriched)
      } catch {
        setError('Failed to load matches.')
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [user?.username])

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="navbar" data-aos="fade-down" data-aos-duration="500">
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                My Profile
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/requests') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Friend Requests
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/watchlist') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Watchlist
              </button>
              <button className="signout" onClick={() => { setMenuOpen(false); signOut(); navigate('/') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="home-main">
        <section className="home-grid-section">
          <p className="section-label" data-aos="fade-up">Discover</p>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="100">Your Matches</h2>
          <p className="section-sub" data-aos="fade-up" data-aos-delay="150">
            People who see films the way you do — ranked by taste compatibility.
          </p>

          {loading && <div className="home-status">Finding your matches...</div>}
          {error && <div className="home-status home-error">{error}</div>}

          {!loading && !error && matches.length === 0 && (
            <div className="profile-empty">
              <span className="profile-empty-icon">💘</span>
              <p>No matches yet. Review more movies to find people with similar taste.</p>
              <button className="md-btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/home')}>
                Browse Movies
              </button>
            </div>
          )}

          {!loading && matches.length > 0 && (
            <div className="matches-grid">
              {matches.map((m, i) => <MatchCard key={m.username} match={m} index={i} />)}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
