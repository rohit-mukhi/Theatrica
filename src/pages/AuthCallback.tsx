import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/reviews`

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      setError('No authorization code received.')
      return
    }

    async function exchange() {
      try {
        const res = await fetch(`${API}/googleAuthCode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirectUri: window.location.origin + '/auth/callback',
          }),
        })
        const data = await res.json()
        if (data.success) {
          setAuth(data.user, data.token, data.isNewUser)
          navigate(data.isNewUser || !data.user.username ? '/setup-username' : '/home')
        } else {
          setError(data.message ?? 'Authentication failed.')
        }
      } catch {
        setError('Failed to complete sign in. Please try again.')
      }
    }

    exchange()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: '1rem' }}>
      {error ? (
        <>
          <p style={{ color: '#e07070', fontSize: '1rem' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: '1px solid rgba(187,148,87,0.3)', color: 'var(--gold)', padding: '0.5rem 1.2rem', borderRadius: '50px', cursor: 'pointer' }}
          >
            ← Back to Home
          </button>
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Signing you in...</p>
      )}
    </div>
  )
}
