import { createContext, useContext } from "react"
import type { AuthUser } from "../application/ports/AuthRepository"

export type AuthStatus = "loading" | "authenticated" | "anonymous"

export type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  sessionMessage: string
  login(username: string, password: string): Promise<void>
  logout(): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider.")
  return context
}
