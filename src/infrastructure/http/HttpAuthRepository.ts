import type {
  AuthRepository,
  AuthResult,
  AuthUser,
  LoginHistoryEvent,
  UserSession,
} from "../../application/ports/AuthRepository"
import { ApiClient } from "./ApiClient"

const REFRESH_TOKEN_KEY = "cdf-refresh-token"

type DataResponse<T,> = {
  data: T
}

export class HttpAuthRepository implements AuthRepository {
  private accessToken: string | null = null
  private refreshInFlight: Promise<AuthUser> | null = null
  private user: AuthUser | null = null
  private expiredHandlers = new Set<() => void>()

  constructor(private readonly client: ApiClient) {
    this.client.configureAuth(
      () => this.accessToken,
      async () => {
        await this.refresh()
      },
    )
  }

  onSessionExpired(handler: () => void) {
    this.expiredHandlers.add(handler)
    return () => this.expiredHandlers.delete(handler)
  }

  async restoreSession() {
    if (!window.sessionStorage.getItem(REFRESH_TOKEN_KEY)) return null
    try {
      return await this.refresh()
    } catch {
      this.clearSession()
      return null
    }
  }

  async login(username: string, password: string) {
    const result = await this.client.request<AuthResult>(
      "/auth/login",
      {
        body: JSON.stringify({ username, password }),
        method: "POST",
      },
      { authenticated: false, retryUnauthorized: false },
    )
    return this.saveSession(result)
  }

  async logout() {
    const refreshToken = window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
    try {
      await this.client.request<void>(
        "/auth/logout",
        refreshToken && !this.accessToken
          ? { body: JSON.stringify({ refreshToken }), method: "POST" }
          : { method: "POST" },
        { retryUnauthorized: false },
      )
    } finally {
      this.clearSession()
    }
  }

  async logoutAll(keepCurrent = true) {
    const response = await this.client.request<DataResponse<{
      closed: number
    }>>("/auth/logout-all", {
      body: JSON.stringify({ keepCurrent }),
      method: "POST",
    })
    if (!keepCurrent) this.clearSession()
    return response.data.closed
  }

  async getSessions() {
    const response =
      await this.client.request<DataResponse<UserSession[]>>("/auth/sessions")
    return response.data
  }

  revokeSession(id: string) {
    return this.client.request<void>(`/auth/sessions/${id}`, {
      method: "DELETE",
    })
  }

  async getLoginHistory(limit = 50) {
    const response =
      await this.client.request<DataResponse<LoginHistoryEvent[]>>(
        `/auth/login-history?limit=${limit}`,
      )
    return response.data
  }

  private refresh() {
    if (this.refreshInFlight) return this.refreshInFlight

    const refreshToken = window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return Promise.reject(new Error("No hay sesión."))

    this.refreshInFlight = this.client
      .request<AuthResult>(
        "/auth/refresh",
        {
          body: JSON.stringify({ refreshToken }),
          method: "POST",
        },
        { authenticated: false, retryUnauthorized: false },
      )
      .then((result) => this.saveSession(result))
      .catch((error) => {
        this.clearSession()
        this.expiredHandlers.forEach((handler) => handler())
        throw error
      })
      .finally(() => {
        this.refreshInFlight = null
      })

    return this.refreshInFlight
  }

  private saveSession(result: AuthResult) {
    this.accessToken = result.token
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken)
    this.user = { ...result.user, sessionId: result.sessionId }
    window.setTimeout(
      () => {
        if (this.user?.sessionId === result.sessionId) {
          void this.refresh().catch(() => undefined)
        }
      },
      Math.max(1, result.expiresIn * 800),
    )
    return this.user
  }

  private clearSession() {
    this.accessToken = null
    this.user = null
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}
