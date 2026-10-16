export type UserRole = "admin" | "operator" | "viewer"

export type AuthUser = {
  id: string
  username: string
  name: string
  role: UserRole
  permissions: string[]
  sessionId: string
}

export type AuthResult = {
  token: string
  expiresIn: number
  refreshToken: string
  refreshExpiresIn: number
  sessionId: string
  user: Omit<AuthUser, "sessionId">
}

export type UserSession = {
  id: string
  current: boolean
  authMethod: "password"
  ip: string
  browser: string
  os: string
  device: string
  userAgent: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  revokedAt: string | null
  revokedReason: "logout" | "logout_all" | "revoked_by_user" | "refresh_reuse_detected" | null
  active: boolean
}

export type LoginHistoryEvent = {
  id: number
  event: "login_success" | "login_failed" | "refresh" | "logout" | "logout_all" | "session_revoked" | "account_locked" | "refresh_reuse_detected"
  success: boolean
  userId: string
  username: string
  reason: "bad_password" | "unknown_user" | "account_locked" | "user_disabled" | null
  sessionId: string | null
  ip: string
  userAgent: string
  createdAt: string
}

export interface AuthRepository {
  onSessionExpired(handler: () => void): () => void
  restoreSession(): Promise<AuthUser | null>
  login(username: string, password: string): Promise<AuthUser>
  logout(): Promise<void>
  logoutAll(keepCurrent?: boolean): Promise<number>
  getSessions(): Promise<UserSession[]>
  revokeSession(id: string): Promise<void>
  getLoginHistory(limit?: number): Promise<LoginHistoryEvent[]>
}
