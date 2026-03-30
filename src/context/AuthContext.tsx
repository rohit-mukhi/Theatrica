import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface AuthUser {
  googleId: string
  username: string
  email: string
  profilePic: string | number
}

interface AuthContextType {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  signOut: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('theatrica_user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem('theatrica_user', JSON.stringify(user))
    else localStorage.removeItem('theatrica_user')
  }, [user])

  function signOut() {
    setUser(null)
    localStorage.removeItem('theatrica_user')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
