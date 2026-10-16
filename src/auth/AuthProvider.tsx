import { useEffect, useMemo, useState } from "react"
import type { AuthUser } from "../application/ports/AuthRepository"
import { dependencies } from "../dependencies"
import { AuthContext, type AuthContextValue, type AuthStatus } from "./useAuth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionMessage, setSessionMessage] = useState("")

  useEffect(() => {
    let active = true
    void dependencies.authRepository.restoreSession().then((restoredUser) => {
      if (!active) return
      setUser(restoredUser)
      setStatus(restoredUser ? "authenticated" : "anonymous")
    })
    const unsubscribe = dependencies.authRepository.onSessionExpired(() => {
      setUser(null)
      setStatus("anonymous")
      setSessionMessage("Tu sesión expiró. Inicia sesión de nuevo.")
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      sessionMessage,
      async login(username, password) {
        const authenticatedUser = await dependencies.authRepository.login(
          username,
          password,
        )
        setUser(authenticatedUser)
        setStatus("authenticated")
        setSessionMessage("")
      },
      async logout() {
        try {
          await dependencies.authRepository.logout()
        } finally {
          setUser(null)
          setStatus("anonymous")
          setSessionMessage("")
        }
      },
    }),
    [sessionMessage, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
