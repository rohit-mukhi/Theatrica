import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useAuth } from '../context/AuthContext'
import '../styles/UsernameSetup.css'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/reviews`

export default function UsernameSetup() {
  const { user, token, updateUsername, signOut } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' })
    // If no user in context, redirect to landing
    if (!user || !token) navigate('/')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers and underscores allowed.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API}/setUsername`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: trimmed }),
      })
      const data = await res.json()
      if (data.success) {
        updateUsername(data.username, data.token)
        navigate('/home')
      } else {
        setError(data.message ?? 'Something went wrong.')
      }
    } catch {
      setError('Failed to set username. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-card" data-aos="zoom-in">
        <div className="setup-avatar">
          {typeof user?.profilePic === 'string'
            ? <img src={user.profilePic} alt="avatar" />
            : <span>{user?.email?.charAt(0).toUpperCase() ?? '?'}</span>
          }
        </div>

        <h1 className="setup-title" data-aos="fade-up" data-aos-delay="100">
          Welcome to Theatrica!
        </h1>
        <p className="setup-sub" data-aos="fade-up" data-aos-delay="150">
          Choose a username. This is permanent and how others will see you.
        </p>

        <form onSubmit={handleSubmit} data-aos="fade-up" data-aos-delay="200">
          <div className="setup-input-wrap">
            <span className="setup-at">@</span>
            <input
              className="setup-input"
              type="text"
              placeholder="your_username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(null) }}
              maxLength={30}
              autoFocus
            />
          </div>
          <p className="setup-hint">3–30 characters. Letters, numbers and underscores only.</p>

          {error && <p className="setup-error">{error}</p>}

          <button
            type="submit"
            className="md-btn-primary setup-btn"
            disabled={submitting || username.trim().length < 3}
          >
            {submitting ? 'Saving...' : 'Continue →'}
          </button>
        </form>

        <button className="setup-signout" onClick={() => { signOut(); navigate('/') }}>
          Sign out and use a different account
        </button>
      </div>
    </div>
  )
}
