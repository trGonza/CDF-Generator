import type {
  AuthRepository,
  AuthUser,
  LoginHistoryEvent,
  UserSession,
} from "../../application/ports/AuthRepository"

const SESSION_KEY = "cdf-local-session"

const DEMO_USER: AuthUser = {
  id: "usr_demo",
  username: "admin",
  name: "Administrador CDF",
  role: "admin",
  permissions: [
    "users:read",
    "users:write",
    "fleet:read",
    "fleet:write",
    "cycles:write",
    "certificates:generate",
    "certificates:print",
    "audit:read",
  ],
  sessionId: "ses_demo_current",
}

const now = new Date()
const minutesAgo = (minutes: number) =>
  new Date(now.getTime() - minutes * 60_000).toISOString()

export class LocalAuthRepository implements AuthRepository {
  onSessionExpired() {
    return () => undefined
  }

  async restoreSession() {
    return window.sessionStorage.getItem(SESSION_KEY) ? DEMO_USER : null
  }

  async login(username: string, password: string) {
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    if (username !== "admin" || password !== "CDF2026") {
      throw new Error("Usuario o contraseña incorrectos.")
    }
    window.sessionStorage.setItem(SESSION_KEY, "active")
    return DEMO_USER
  }

  async logout() {
    window.sessionStorage.removeItem(SESSION_KEY)
  }

  async logoutAll() {
    return 2
  }

  async getSessions(): Promise<UserSession[]> {
    return [
      {
        id: "ses_demo_current",
        current: true,
        authMethod: "password",
        ip: "203.0.113.7",
        browser: "Chrome",
        os: "Windows",
        device: "Escritorio",
        userAgent: "Chrome · Windows",
        createdAt: minutesAgo(82),
        lastSeenAt: minutesAgo(5),
        expiresAt: new Date(now.getTime() + 6 * 86_400_000).toISOString(),
        revokedAt: null,
        revokedReason: null,
        active: true,
      },
      {
        id: "ses_demo_mobile",
        current: false,
        authMethod: "password",
        ip: "198.51.100.9",
        browser: "Safari",
        os: "iOS",
        device: "Móvil",
        userAgent: "Safari · iOS",
        createdAt: minutesAgo(1_400),
        lastSeenAt: minutesAgo(45),
        expiresAt: new Date(now.getTime() + 5 * 86_400_000).toISOString(),
        revokedAt: null,
        revokedReason: null,
        active: true,
      },
    ]
  }

  async revokeSession() {}

  async getLoginHistory(): Promise<LoginHistoryEvent[]> {
    return [
      {
        id: 41,
        event: "login_success",
        success: true,
        userId: DEMO_USER.id,
        username: DEMO_USER.username,
        reason: null,
        sessionId: DEMO_USER.sessionId,
        ip: "203.0.113.7",
        userAgent: "Chrome · Windows · Escritorio",
        createdAt: minutesAgo(82),
      },
      {
        id: 40,
        event: "login_failed",
        success: false,
        userId: DEMO_USER.id,
        username: DEMO_USER.username,
        reason: "bad_password",
        sessionId: null,
        ip: "203.0.113.7",
        userAgent: "Chrome · Windows · Escritorio",
        createdAt: minutesAgo(95),
      },
    ]
  }
}
