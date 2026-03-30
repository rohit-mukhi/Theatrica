import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './App.css'
import Footer from './components/Footer'
import { useAuth } from './context/AuthContext'


const SLIDES = [
  { genre: 'Top Pick',   title: 'Oppenheimer',           desc: 'A gripping biographical thriller about the father of the atomic bomb.' },
  { genre: 'Trending',   title: 'Dune: Part Two',         desc: 'Paul Atreides unites with the Fremen to wage war against the Harkonnens.' },
  { genre: 'Staff Pick', title: 'The Shawshank Redemption', desc: 'Two imprisoned men bond over years, finding solace and eventual redemption.' },
  { genre: 'Classic',    title: 'Blade Runner 2049',      desc: 'A young blade runner unearths a long-buried secret that could plunge society into chaos.' },
]

function useSlidePosters() {
  const [posters, setPosters] = useState<Record<string, string>>({})

  useEffect(() => {
    const key = import.meta.env.VITE_OMDB_API_KEY
    if (!key) return
    SLIDES.forEach(async s => {
      const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(s.title)}&apikey=${key}`)
      const data = await res.json()
      if (data.Response === 'True' && data.Poster !== 'N/A') {
        setPosters(prev => ({ ...prev, [s.title]: data.Poster }))
      }
    })
  }, [])

  return posters
}

const FEATURES = [
  {
    icon: '🎬',
    title: 'Rate & Review Films',
    desc: 'Write honest reviews and rate every film you watch. Your taste is your profile.',
  },
  {
    icon: '💘',
    title: 'Match by Taste',
    desc: 'We compare your reviews and ratings with others to surface people who see the world the way you do.',
  },
  {
    icon: '💬',
    title: 'Start a Conversation',
    desc: 'Break the ice over a shared favourite film. No awkward openers — just genuine common ground.',
  },
  {
    icon: '🔍',
    title: 'Deep Film Discovery',
    desc: 'Filter by mood, decade, director, or theme. Find your next obsession and the people who share it.',
  },
  {
    icon: '📋',
    title: 'Watchlist & Compatibility',
    desc: 'Build your watchlist and see how much overlap you have with a potential match before you even say hello.',
  },
  {
    icon: '🌟',
    title: 'Taste Profile',
    desc: 'Your reviews build a rich public profile that shows who you are far better than any bio ever could.',
  },
]

function Carousel() {
  const [current, setCurrent] = useState(0)
  const posters = useSlidePosters()

  const prev = useCallback(() =>
    setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), [])
  const next = useCallback(() =>
    setCurrent(c => (c + 1) % SLIDES.length), [])

  useEffect(() => {
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [next])

  return (
    <div className="carousel-wrapper" data-aos="zoom-in" data-aos-delay="300">
      <div className="carousel">
        <div className="carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className="carousel-slide"
              style={{
                backgroundImage: posters[s.title] ? `url(${posters[s.title]})` : undefined,
                backgroundColor: posters[s.title] ? undefined : 'var(--espresso)'
              }}
            >
              <div className="carousel-caption">
                <span className="badge">{s.genre}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="carousel-btn prev" onClick={prev} aria-label="Previous">&#8592;</button>
      <button className="carousel-btn next" onClick={next} aria-label="Next">&#8594;</button>

      <div className="carousel-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`dot${i === current ? ' active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const handleGoogleResponseRef = useRef<((response: any) => void) | null>(null)

  async function handleGoogleResponse(response: any) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/reviews/googleAuth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        }
      )
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        navigate('/home')
      }
    } catch (e) {
      console.error('Google auth failed', e)
    }
  }

  // Keep ref in sync so the onload closure always calls the latest version
  handleGoogleResponseRef.current = handleGoogleResponse

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' })

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      ;(window as any).google?.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: any) => handleGoogleResponseRef.current?.(response),
      })
      // Render a hidden div as the Google button target
      ;(window as any).google?.accounts.id.renderButton(
        document.getElementById('google-btn-target'),
        { theme: 'filled_black', size: 'large', width: 300 }
      )
      ;(window as any).google?.accounts.id.prompt()
    }

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [])

  function handleGetStarted() {
    if (user) {
      navigate('/home')
    } else {
      ;(window as any).google?.accounts.id.prompt()
    }
  }

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar" data-aos="fade-down" data-aos-duration="500">
        <a href="#" className="navbar-logo"><span>Theatrica</span></a>
        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#">Browse</a></li>
          <li><a href="#">Top Rated</a></li>
          <li><a href="#">About</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <p className="hero-eyebrow" data-aos="fade-down" data-aos-delay="100">Movies. Reviews. Connections.</p>
        <h1 className="hero-title" data-aos="fade-up" data-aos-delay="200">
          Find Your Film.<br />Find Your <em>Person.</em>
        </h1>
        <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="300">
          Review the movies you love, discover people who feel the same way,
          and let shared taste spark something real.
        </p>

        <Carousel />

        <button
          className="get-started-btn"
          onClick={handleGetStarted}
          data-aos="fade-up"
          data-aos-delay="400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
          </svg>
          Get Started — It's Free
        </button>

        {/* Google Sign-In button rendered here when One Tap is suppressed */}
        {!user && <div id="google-btn-target" data-aos="fade-up" data-aos-delay="450" style={{ marginTop: '1rem' }} />}
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <p className="section-label" data-aos="fade-up">What we offer</p>
        <h2 className="section-title" data-aos="fade-up" data-aos-delay="100">Where cinema meets connection</h2>
        <p className="section-sub" data-aos="fade-up" data-aos-delay="150">
          Theatrica is the only place where your love of film can lead to your next great relationship.
        </p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              className="feature-card"
              key={i}
              data-aos="fade-up"
              data-aos-delay={`${i * 80}`}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}
