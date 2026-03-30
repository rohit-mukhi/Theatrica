import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface AuthUser {
  googleId: string
  username: string | null
  email: string
  profilePic: string | number
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isNewUser: boolean
  setAuth: (user: AuthUser, token: string, isNewUser: boolean) => void
  updateUsername: (username: string, token: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isNewUser: false,
  setAuth: () => {},
  updateUsername: () => {},
  signOut: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('theatrica_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('theatrica_token')
  )
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem('theatrica_user', JSON.stringify(user))
    else localStorage.removeItem('theatrica_user')
  }, [user])

  useEffect(() => {
    if (token) localStorage.setItem('theatrica_token', token)
    else localStorage.removeItem('theatrica_token')
  }, [token])

  function setAuth(user: AuthUser, token: string, isNewUser: boolean) {
    setUser(user)
    setToken(token)
    setIsNewUser(isNewUser)
  }

  function updateUsername(username: string, newToken: string) {
    setUser(prev => prev ? { ...prev, username } : prev)
    setToken(newToken)
    setIsNewUser(false)
  }

  function signOut() {
    setUser(null)
    setToken(null)
    setIsNewUser(false)
    localStorage.removeItem('theatrica_user')
    localStorage.removeItem('theatrica_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, isNewUser, setAuth, updateUsername, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
