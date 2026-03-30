import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import '../styles/Profile.css'

interface Review {
  _id: string
  movieId: string
  user: string
  review: string
  rating: number
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

function Navbar({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="navbar" data-aos="fade-down">
      <a href="/home" className="navbar-logo"><span>Theatrica</span></a>
      <ul className="navbar-links">
        <li><a href="/home">Browse</a></li>
        <li><a href="#">Matches</a></li>
        <li><a href="#">Watchlist</a></li>
      </ul>
      <div className="hamburger-wrapper" ref={dropdownRef}>
        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
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
            <button className="signout" onClick={() => { setMenuOpen(false); navigate('/') }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const displayName = user?.username ?? 'Guest'
  const profilePic = typeof user?.profilePic === 'string' ? user.profilePic : null
  const [menuOpen, setMenuOpen] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [activeTab, setActiveTab] = useState<'reviews' | 'settings'>('reviews')

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1)
    : '—'

  const visibleReviews = showAll ? reviews : reviews.slice(0, 4)

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' })
    window.scrollTo(0, 0)
  }, [])

  // Fetch all reviews by this user across all movies
  useEffect(() => {
    async function fetchUserReviews() {
      setLoading(true)
      try {
        // Backend doesn't have a user-specific endpoint yet,
        // so we fetch recent reviews and filter by username client-side.
        // TODO: add GET /api/v1/reviews/user/:username to backend
        setReviews([])
      } catch {
        setReviews([])
      } finally {
        setLoading(false)
      }
    }
    fetchUserReviews()
  }, [])

  return (
    <div className="home">
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <main className="home-main">
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
            <h1 className="profile-name" data-aos="fade-up" data-aos-delay="100">{displayName}</h1>
            <p className="profile-tagline" data-aos="fade-up" data-aos-delay="150">{user?.email ?? 'Film lover · Theatrica member'}</p>
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
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <span className="stat-value">0</span>
                <span className="stat-label">Matches</span>
              </div>
            </div>
          </div>
        </section>

        {/* TABS */}
        <div className="profile-tabs" data-aos="fade-up" data-aos-delay="250">
          <button
            className={`profile-tab${activeTab === 'reviews' ? ' active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            My Reviews
          </button>
          <button
            className={`profile-tab${activeTab === 'settings' ? ' active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <section className="profile-section" data-aos="fade-up">
            {loading && <div className="home-status">Loading reviews...</div>}

            {!loading && reviews.length === 0 && (
              <div className="profile-empty">
                <span className="profile-empty-icon">🎬</span>
                <p>You haven't reviewed any movies yet.</p>
                <button className="md-btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/home')}>
                  Browse Movies
                </button>
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
                        <span className="profile-review-movie">{r.movieId}</span>
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
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <section className="profile-section profile-settings" data-aos="fade-up">
            <div className="settings-group">
              <h3 className="settings-group-title">Account</h3>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Display Name</p>
                  <p className="settings-value">{displayName}</p>
                </div>
                <button className="settings-edit-btn">Edit</button>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Email</p>
                  <p className="settings-value">{user?.email ?? 'Connected via Google'}</p>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3 className="settings-group-title">Preferences</h3>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Favourite Genre</p>
                  <p className="settings-value">Not set</p>
                </div>
                <button className="settings-edit-btn">Edit</button>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Matching</p>
                  <p className="settings-value">Enabled</p>
                </div>
                <button className="settings-edit-btn">Edit</button>
              </div>
            </div>

            <div className="settings-group">
              <h3 className="settings-group-title">Danger Zone</h3>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Sign Out</p>
                  <p className="settings-value">Sign out of your Theatrica account</p>
                </div>
                <button className="settings-danger-btn" onClick={() => { signOut(); navigate('/') }}>Sign Out</button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
