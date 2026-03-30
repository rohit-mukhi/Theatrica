import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useMovies } from '../hooks/useMovies'
import { useSearch } from '../hooks/useSearch'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import '../styles/Home.css'

function InfiniteCarousel({ posters, paused }: { posters: { src: string; title: string }[], paused: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const animIdRef = useRef(0)
  const items = [...posters, ...posters]

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const speed = 0.6

    function step() {
      posRef.current += speed
      const half = track!.scrollWidth / 2
      if (posRef.current >= half) posRef.current = 0
      track!.style.transform = `translateX(-${posRef.current}px)`
      animIdRef.current = requestAnimationFrame(step)
    }

    if (!paused) {
      animIdRef.current = requestAnimationFrame(step)
    } else {
      cancelAnimationFrame(animIdRef.current)
    }

    return () => cancelAnimationFrame(animIdRef.current)
  }, [posters, paused])

  return (
    <div className="home-banner">
      <div className="home-banner-track" ref={trackRef}>
        {items.map((p, i) => (
          <div className="home-banner-item" key={i}>
            <img src={p.src} alt={p.title} />
          </div>
        ))}
      </div>
    </div>
  )
}

function MovieCard({ movie, index }: { movie: { Title: string; Poster: string; Plot: string; Year: string; imdbID: string }, index: number }) {
  const poster = movie.Poster !== 'N/A' ? movie.Poster : null
  const navigate = useNavigate()

  return (
    <div className="movie-card" data-aos="fade-up" data-aos-delay={`${(index % 4) * 80}`} onClick={() => navigate(`/movie/${movie.imdbID}`)} style={{ cursor: 'pointer' }}>
      <div className="movie-card-poster">
        {poster
          ? <img src={poster} alt={movie.Title} />
          : <div className="movie-card-no-poster">No Poster</div>
        }
      </div>
      <div className="movie-card-info">
        <h3>{movie.Title}</h3>
        <span className="movie-card-year">{movie.Year}</span>
        <p>{movie.Plot}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const { user, signOut } = useAuth()
  const { movies, loading, error } = useMovies()
  const { results, loading: searching, error: searchError, query, search, clear } = useSearch()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const isSearchMode = query.trim().length > 0
  const posters = movies.filter(m => m.Poster && m.Poster !== 'N/A').map(m => ({ src: m.Poster, title: m.Title }))

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' })
    window.scrollTo(0, 0)
  }, [])

  // Focus input when search bar opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close search on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCloseSearch()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function handleCloseSearch() {
    setSearchOpen(false)
    setSearchInput('')
    clear()
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim()) {
      search(searchInput.trim())
      setSearchOpen(false)
    }
  }

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="navbar" data-aos="fade-down" data-aos-duration="500">
        <a href="/" className="navbar-logo"><span>Theatrica</span></a>
        <ul className="navbar-links">
          <li><a href="#">Browse</a></li>
          <li><a href="#">Matches</a></li>
          <li><a href="#">Watchlist</a></li>
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
              <button onClick={() => { setMenuOpen(false); signOut(); navigate('/') }} className="signout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* SEARCH BAR */}
      <div className={`search-overlay${searchOpen ? ' active' : ''}`} onClick={handleCloseSearch} />
      <div className={`search-bar-wrap${searchOpen ? ' active' : ''}`}>
        <button
          className="search-icon-btn"
          onClick={() => setSearchOpen(o => !o)}
          aria-label="Search"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <form className={`search-form${searchOpen ? ' open' : ''}`} onSubmit={handleSearchSubmit}>
          <input
            ref={searchRef}
            type="text"
            className="search-input"
            placeholder="Search for a movie..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button type="button" className="search-clear" onClick={() => setSearchInput('')} aria-label="Clear">✕</button>
          )}
        </form>
      </div>

      <main className="home-main">
        {/* SEARCH RESULTS MODE */}
        {isSearchMode ? (
          <section className="home-grid-section">
            <div className="search-results-header">
              <div>
                <p className="section-label" data-aos="fade-up">Search Results</p>
                <h2 className="section-title" data-aos="fade-up" data-aos-delay="100">
                  "{query}"
                </h2>
              </div>
              <button className="search-back-btn" onClick={handleCloseSearch} data-aos="fade-left">
                ← Back to Home
              </button>
            </div>
            {searching && <div className="home-status">Searching...</div>}
            {searchError && <div className="home-status home-error">{searchError}</div>}
            {!searching && !searchError && results.length === 0 && (
              <div className="home-status">No movies found for "{query}".</div>
            )}
            {!searching && results.length > 0 && (
              <div className="movie-grid">
                {results.map((m, i) => <MovieCard key={m.imdbID} movie={m} index={i} />)}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* INFINITE BANNER CAROUSEL */}
            <section className="home-banner-section">
              <p className="section-label" data-aos="fade-down">Now Showing</p>
              <h2 className="section-title" data-aos="fade-down" data-aos-delay="100">Latest & Greatest</h2>
              {loading && <div className="home-status">Loading movies...</div>}
              {error && <div className="home-status home-error">{error}</div>}
              {!loading && !error && posters.length > 0 && (
                <div data-aos="fade-up" data-aos-delay="150">
                  <InfiniteCarousel posters={posters} paused={searchOpen} />
                </div>
              )}
            </section>

            {/* MOVIE CARDS GRID */}
            <section className="home-grid-section">
              <p className="section-label" data-aos="fade-up">Explore</p>
              <h2 className="section-title" data-aos="fade-up" data-aos-delay="100">Top Picks For You</h2>
              {loading && <div className="home-status">Loading...</div>}
              {error && <div className="home-status home-error">{error}</div>}
              {!loading && !error && (
                <div className="movie-grid">
                  {movies.map((m, i) => <MovieCard key={m.imdbID} movie={m} index={i} />)}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
