import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useWatchlist } from '../hooks/useWatchlist'
import '../styles/Home.css'

const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY

interface Movie {
  imdbID: string
  Title: string
  Poster: string
  Plot: string
  Year: string
}

function BookmarkBtn({ inList, onClick }: { inList: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      className={`bookmark-btn${inList ? ' active' : ''}`}
      onClick={onClick}
      aria-label={inList ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <svg viewBox="0 0 24 24" fill={inList ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}

function MovieCard({ movie, index, isInWatchlist, toggleWatchlist }: {
  movie: Movie
  index: number
  isInWatchlist: (id: string) => boolean
  toggleWatchlist: (id: string) => void
}) {
  const poster = movie.Poster !== 'N/A' ? movie.Poster : null
  const navigate = useNavigate()

  return (
    <div
      className="movie-card"
      data-aos="fade-up"
      data-aos-delay={`${(index % 4) * 80}`}
      onClick={() => navigate(`/movie/${movie.imdbID}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="movie-card-poster" style={{ position: 'relative' }}>
        {poster
          ? <img src={poster} alt={movie.Title} />
          : <div className="movie-card-no-poster">No Poster</div>
        }
        <BookmarkBtn
          inList={isInWatchlist(movie.imdbID)}
          onClick={e => { e.stopPropagation(); toggleWatchlist(movie.imdbID) }}
        />
      </div>
      <div className="movie-card-info">
        <h3>{movie.Title}</h3>
        <span className="movie-card-year">{movie.Year}</span>
        <p>{movie.Plot}</p>
      </div>
    </div>
  )
}

export default function Watchlist() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { watchlist, loading: watchlistLoading, isInWatchlist, toggle: toggleWatchlist } = useWatchlist(user?.username ?? null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [moviesLoading, setMoviesLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' })
    window.scrollTo(0, 0)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch movie details from OMDB whenever watchlist changes
  useEffect(() => {
    if (watchlist.length === 0) { setMovies([]); return }
    setMoviesLoading(true)
    Promise.all(
      watchlist.map(id =>
        fetch(`https://www.omdbapi.com/?i=${id}&apikey=${OMDB_KEY}&plot=short`)
          .then(r => r.json())
          .then(d => d.Response === 'True' ? d as Movie : null)
          .catch(() => null)
      )
    )
      .then(results => setMovies(results.filter(Boolean) as Movie[]))
      .finally(() => setMoviesLoading(false))
  }, [watchlist])

  const loading = watchlistLoading || moviesLoading

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="navbar" data-aos="fade-down" data-aos-duration="500">
        <a href="/" className="navbar-logo"><span>Theatrica</span></a>
        <ul className="navbar-links">
          <li><a href="/home">Browse</a></li>
          <li><a href="/matches">Matches</a></li>
          <li><a href="/watchlist">Watchlist</a></li>
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
          <p className="section-label" data-aos="fade-up">Your List</p>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="100">Watchlist</h2>

          {loading && <div className="home-status">Loading your watchlist...</div>}

          {!loading && movies.length === 0 && (
            <div className="profile-empty">
              <span className="profile-empty-icon">🎬</span>
              <p>Your watchlist is empty. Browse movies to add some.</p>
              <button className="md-btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/home')}>
                Browse Movies
              </button>
            </div>
          )}

          {!loading && movies.length > 0 && (
            <div className="movie-grid">
              {movies.map((m, i) => (
                <MovieCard
                  key={m.imdbID}
                  movie={m}
                  index={i}
                  isInWatchlist={isInWatchlist}
                  toggleWatchlist={toggleWatchlist}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
