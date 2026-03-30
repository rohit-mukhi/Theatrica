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
  const { user, setAuth } = useAuth()
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
        setAuth(data.user, data.token, data.isNewUser)
        navigate(data.isNewUser || !data.user.username ? '/setup-username' : '/home')
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
      ;(window as any).google?.accounts.id.prompt()
    }

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [])

  function handleGetStarted() {
    if (user) {
      navigate('/home')
      return
    }
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')
      const scope = encodeURIComponent('openid email profile')
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="white" fillOpacity="0.15" stroke="none"/>
            <path d="M21.8 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.5c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.7 3-4.3 3-6.9z" fill="#4285F4" stroke="none"/>
            <path d="M12 22c2.7 0 5-0.9 6.7-2.4l-3.2-2.5c-.9.6-2 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2H3v2.5C4.7 19.9 8.1 22 12 22z" fill="#34A853" stroke="none"/>
            <path d="M6.3 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.6H3C2.4 8.8 2 10.4 2 12s.4 3.2 1 4.4l3.3-2.5z" fill="#FBBC05" stroke="none"/>
            <path d="M12 5.8c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 2.8 14.7 2 12 2 8.1 2 4.7 4.1 3 7.6l3.3 2.5C7.1 7.6 9.3 5.8 12 5.8z" fill="#EA4335" stroke="none"/>
          </svg>
          Get Started with Google
        </button>
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
