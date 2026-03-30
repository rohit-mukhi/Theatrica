import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useMovieDetail } from '../hooks/useMovieDetail'
import { useReviews, type Review } from '../hooks/useReviews'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import '../styles/MovieDetail.css'

const REVIEW_LIMIT = 100

// ── STAR DISPLAY ──
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= rating ? 'star filled' : 'star'}>★</span>
      ))}
    </div>
  )
}

// ── REVIEW CARD ──
function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <div className="review-card" data-aos="fade-up" data-aos-delay={`${(index % 3) * 100}`}>
      <div className="review-header">
        <div className="review-avatar">{review.user.charAt(0).toUpperCase()}</div>
        <div>
          <p className="review-user">{review.user}</p>
        </div>
        <StarRating rating={Number(review.rating)} />
      </div>
      <p className="review-text">{review.review}</p>
    </div>
  )
}

// ── REVIEW MODAL ──
function ReviewModal({
  movieTitle,
  onClose,
  onSubmitted,
  postReview,
}: {
  movieTitle: string
  onClose: () => void
  onSubmitted: () => void
  postReview: (user: string, review: string, rating: number) => Promise<void>
}) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [text, setText] = useState('')
  const [user, setUser] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating || !text.trim() || !user.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await postReview(user.trim(), text.trim(), rating)
      setSubmitted(true)
      onSubmitted()
    } catch {
      setSubmitError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" data-aos="zoom-in" data-aos-duration="300">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {submitted ? (
          <div className="modal-success">
            <span className="modal-success-icon">🎬</span>
            <h3>Review submitted!</h3>
            <p>Thanks for reviewing <em>{movieTitle}</em>.</p>
            <button className="md-btn-primary" style={{ marginTop: '1.2rem' }} onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="modal-title">Your Review</h3>
            <p className="modal-subtitle">{movieTitle}</p>

            <div className="modal-field" style={{ marginBottom: '1rem' }}>
              <input
                className="modal-input"
                type="text"
                placeholder="Your name"
                value={user}
                onChange={e => setUser(e.target.value)}
                maxLength={40}
              />
            </div>

            <div className="modal-stars">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  type="button"
                  key={s}
                  className={`modal-star${s <= (hovered || rating) ? ' active' : ''}`}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  aria-label={`${s} star`}
                >★</button>
              ))}
            </div>
            {rating > 0 && (
              <p className="modal-rating-label">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
              </p>
            )}

            <div className="modal-field">
              <textarea
                placeholder="Write your review... (max 100 characters)"
                value={text}
                maxLength={REVIEW_LIMIT}
                onChange={e => setText(e.target.value)}
                rows={4}
              />
              <span className={`modal-char-count${text.length >= REVIEW_LIMIT ? ' at-limit' : ''}`}>
                {text.length} / {REVIEW_LIMIT}
              </span>
            </div>

            {submitError && <p className="modal-error">{submitError}</p>}

            <button
              type="submit"
              className="md-btn-primary modal-submit"
              disabled={!rating || !text.trim() || !user.trim() || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── MAIN PAGE ──
export default function MovieDetail() {
  const { signOut } = useAuth()
  const { imdbID } = useParams<{ imdbID: string }>()
  const navigate = useNavigate()
  const { movie, loading, error } = useMovieDetail(imdbID ?? '')
  const { reviews, loading: reviewsLoading, error: reviewsError, refetch, postReview } = useReviews(imdbID ?? '')

  const [showAll, setShowAll] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3)

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' })
    window.scrollTo(0, 0)
    setTimeout(() => AOS.refresh(), 100)
  }, [imdbID])

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="navbar" data-aos="fade-down">
        <a href="/home" className="navbar-logo"><span>Theatrica</span></a>
        <ul className="navbar-links">
          <li><a href="/home">Browse</a></li>
          <li><a href="#">Matches</a></li>
          <li><a href="#">Watchlist</a></li>
        </ul>
        <div className="hamburger-wrapper">
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
        {loading && <div className="home-status">Loading movie details...</div>}
        {error && <div className="home-status home-error">{error}</div>}

        {movie && (
          <>
            {/* HERO SECTION */}
            <section className="md-hero">
              <div className="md-poster-wrap" data-aos="fade-right" data-aos-duration="700">
                {movie.Poster !== 'N/A'
                  ? <img src={movie.Poster} alt={movie.Title} className="md-poster" />
                  : <div className="md-no-poster">No Poster</div>
                }
              </div>

              <div className="md-info">
                <div className="md-badges" data-aos="fade-down" data-aos-delay="100">
                  {movie.Rated !== 'N/A' && <span className="badge">{movie.Rated}</span>}
                  {movie.Genre.split(',').slice(0, 2).map(g => (
                    <span className="badge badge-outline" key={g}>{g.trim()}</span>
                  ))}
                </div>

                <h1 className="md-title" data-aos="fade-up" data-aos-delay="150">{movie.Title}</h1>

                <div className="md-meta" data-aos="fade-up" data-aos-delay="200">
                  <span>{movie.Year}</span>
                  <span className="dot-sep">·</span>
                  <span>{movie.Runtime}</span>
                  <span className="dot-sep">·</span>
                  <span>{movie.Language}</span>
                  {movie.imdbRating !== 'N/A' && (
                    <>
                      <span className="dot-sep">·</span>
                      <span className="md-rating">⭐ {movie.imdbRating} / 10</span>
                    </>
                  )}
                </div>

                <p className="md-plot" data-aos="fade-up" data-aos-delay="250">{movie.Plot}</p>

                <div className="md-crew" data-aos="fade-up" data-aos-delay="300">
                  <p><span>Director</span>{movie.Director}</p>
                  <p><span>Cast</span>{movie.Actors}</p>
                </div>

                <div className="md-actions" data-aos="fade-up" data-aos-delay="350">
                  <button className="md-btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                    </svg>
                    Watch Now
                  </button>
                  <button className="md-btn-secondary" onClick={() => setReviewOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Review
                  </button>
                </div>
              </div>
            </section>

            {/* REVIEWS SECTION */}
            <section className="md-reviews-section">
              <div className="md-reviews-header" data-aos="fade-up">
                <div>
                  <p className="section-label" data-aos="fade-right" data-aos-delay="100">Community</p>
                  <h2 className="section-title" data-aos="fade-right" data-aos-delay="150" style={{ textAlign: 'left', marginBottom: 0 }}>
                    Reviews {!reviewsLoading && reviews.length > 0 && (
                      <span className="reviews-count">({reviews.length})</span>
                    )}
                  </h2>
                </div>
                {!showAll && reviews.length > 3 && (
                  <button className="see-all-btn" data-aos="fade-left" data-aos-delay="150" onClick={() => setShowAll(true)}>
                    See all reviews ↓
                  </button>
                )}
              </div>

              {reviewsLoading && <div className="home-status">Loading reviews...</div>}
              {reviewsError && <div className="home-status home-error">Could not load reviews.</div>}

              {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                <div className="no-reviews">
                  <p>No reviews yet. Be the first to review this film!</p>
                  <button className="md-btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setReviewOpen(true)}>
                    Add Review
                  </button>
                </div>
              )}

              {!reviewsLoading && reviews.length > 0 && (
                <div className="reviews-grid">
                  {visibleReviews.map((r, i) => <ReviewCard key={r._id} review={r} index={i} />)}
                </div>
              )}

              {showAll && (
                <button className="see-all-btn collapse-btn" onClick={() => {
                  setShowAll(false)
                  window.scrollTo({ top: document.querySelector('.md-reviews-section')?.getBoundingClientRect().top! + window.scrollY - 100, behavior: 'smooth' })
                }}>
                  ↑ Show less
                </button>
              )}
            </section>
          </>
        )}
      </main>

      {reviewOpen && movie && (
        <ReviewModal
          movieTitle={movie.Title}
          onClose={() => setReviewOpen(false)}
          onSubmitted={() => { refetch(); setReviewOpen(false) }}
          postReview={postReview}
        />
      )}

      <Footer />
    </div>
  )
}
