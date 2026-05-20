import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useConnection } from '../hooks/useConnection'
import '../styles/Profile.css'
import '../styles/UserProfile.css'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/reviews`
const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY

interface Review {
  _id: string
  movieId: string
  movieTitle?: string
  user: string
  review: string
  rating: number
}

interface UserInfo {
  username: string
  profilePic: string | null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= Number(rating) ? 'star filled' : 'star'}>★</span>
      ))}
    </div>
  )
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isOwnProfile = user?.username === username
  const { status, direction, acting, sendRequest, acceptRequest, rejectRequest, removeFriend, blockUser, unblockUser } = useConnection(user?.username ?? null, username ?? null)

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1)
    : '—'

  const visibleReviews = showAll ? reviews : reviews.slice(0, 4)

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
    if (!username) return
    // Redirect to own profile page if viewing yourself
    if (isOwnProfile) { navigate('/profile', { replace: true }); return }

    async function fetchData() {
      setLoading(true)
      try {
        // Fetch user info and reviews in parallel
        const [userRes, reviewsRes] = await Promise.all([
          fetch(`${API}/getUser/${encodeURIComponent(username!)}`),
          fetch(`${API}/user/${encodeURIComponent(username!)}`)
        ])
        const userData = await userRes.json()
        const reviewsData = await reviewsRes.json()

        setUserInfo({
          username: userData.username ?? username!,
          profilePic: typeof userData.profilePic === 'string' ? userData.profilePic : null,
        })

        const raw: Review[] = Array.isArray(reviewsData) ? reviewsData : []
        const enriched = await Promise.all(
          raw.map(async r => {
            try {
              const omdb = await fetch(`https://www.omdbapi.com/?i=${r.movieId}&apikey=${OMDB_KEY}&plot=none`)
              const movie = await omdb.json()
              return { ...r, movieTitle: movie.Response === 'True' ? movie.Title : r.movieId }
            } catch {
              return { ...r, movieTitle: r.movieId }
            }
          })
        )
        setReviews(enriched)
      } catch {
        setReviews([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [username, isOwnProfile])

  const displayName = userInfo?.username ?? username ?? ''
  const profilePic = userInfo?.profilePic ?? null

  return (
    <div className="home">
      {/* NAVBAR */}
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
              <button onClick={() => { setMenuOpen(false); navigate('/matches') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Matches
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/watchlist') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Watchlist
              </button>
              {user && (
                <button className="signout" onClick={() => { setMenuOpen(false); signOut(); navigate('/') }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="home-main">
        {/* BACK BUTTON */}
        <div className="userprofile-back">
          <button className="search-back-btn" onClick={() => navigate(-1)}>← Back</button>
        </div>

        {/* PROFILE HEADER */}
        <section className="profile-header" data-aos="fade-up">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {profilePic
                ? <img src={profilePic} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : displayName.charAt(0).toUpperCase()
              }
            </div>
          </div>
          <div className="profile-meta">
            <h1 className="profile-name" data-aos="fade-up" data-aos-delay="100">@{displayName}</h1>
            <p className="profile-tagline" data-aos="fade-up" data-aos-delay="150">Film lover · Theatrica member</p>
            <div className="profile-stats" data-aos="fade-up" data-aos-delay="200">
              <div className="profile-stat">
                <span className="stat-value">{reviews.length}</span>
                <span className="stat-label">Reviews</span>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <span className="stat-value">{avgRating}</span>
                <span className="stat-label">Avg Rating</span>
              </div>
            </div>

            {/* CONNECTION ACTIONS */}
            {user && (
              <div className="up-actions" data-aos="fade-up" data-aos-delay="250">
                {status === 'none' && (
                  <button className="up-btn up-btn-primary" onClick={sendRequest} disabled={acting}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    {acting ? 'Sending...' : 'Connect'}
                  </button>
                )}
                {status === 'pending' && direction === 'sent' && (
                  <button className="up-btn up-btn-muted" disabled>Request Sent</button>
                )}
                {status === 'pending' && direction === 'received' && (
                  <>
                    <button className="up-btn up-btn-primary" onClick={acceptRequest} disabled={acting}>Accept</button>
                    <button className="up-btn up-btn-ghost" onClick={rejectRequest} disabled={acting}>Decline</button>
                  </>
                )}
                {status === 'accepted' && (
                  <>
                    <button className="up-btn up-btn-primary" onClick={() => navigate(`/chat/${username}`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      Message
                    </button>
                    <button className="up-btn up-btn-ghost" onClick={removeFriend} disabled={acting}>Unfriend</button>
                  </>
                )}
                {status === 'blocked' && (
                  <button className="up-btn up-btn-ghost" onClick={unblockUser} disabled={acting}>Unblock</button>
                )}
                {status !== 'blocked' && (
                  <button className="up-btn up-btn-danger" onClick={blockUser} disabled={acting}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    Block
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* REVIEWS */}
        <section className="profile-section" data-aos="fade-up">
          <p className="section-label userprofile-reviews-label">Their Reviews</p>

          {loading && <div className="home-status">Loading...</div>}

          {!loading && reviews.length === 0 && (
            <div className="profile-empty">
              <span className="profile-empty-icon">🎬</span>
              <p>{displayName} hasn't reviewed any movies yet.</p>
            </div>
          )}

          {!loading && reviews.length > 0 && (
            <>
              <div className="profile-reviews-grid">
                {visibleReviews.map((r, i) => (
                  <div
                    className="profile-review-card"
                    key={r._id}
                    data-aos="fade-up"
                    data-aos-delay={`${(i % 2) * 100}`}
                    onClick={() => navigate(`/movie/${r.movieId}`)}
                  >
                    <div className="profile-review-top">
                      <span className="profile-review-movie">{r.movieTitle ?? r.movieId}</span>
                      <StarRating rating={r.rating} />
                    </div>
                    <p className="profile-review-text">{r.review}</p>
                  </div>
                ))}
              </div>
              {reviews.length > 4 && (
                <button className="see-all-btn" style={{ display: 'block', margin: '2rem auto 0' }} onClick={() => setShowAll(o => !o)}>
                  {showAll ? '↑ Show less' : `See all ${reviews.length} reviews ↓`}
                </button>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
