import { API_CONFIG } from "../../config/api"

type ApiErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

type RequestOptions = {
  authenticated?: boolean
  retryUnauthorized?: boolean
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: Record<string, string> = {},
    public readonly requestId?: string,
  ) {
    super(message)
  }
}

export class ApiClient {
  private getAccessToken: () => string | null = () => null
  private refreshAccessToken: () => Promise<void> = async () => undefined

  constructor(
    private readonly baseUrl = (API_CONFIG.useDevelopmentProxy
      ? API_CONFIG.proxyPath
      : API_CONFIG.baseUrl
    ).replace(/\/$/, ""),
  ) {}

  configureAuth(
    getAccessToken: () => string | null,
    refreshAccessToken: () => Promise<void>,
  ) {
    this.getAccessToken = getAccessToken
    this.refreshAccessToken = refreshAccessToken
  }

  async request<T,>(
    path: string,
    init?: RequestInit,
    options: RequestOptions = {},
  ): Promise<T> {
    const { authenticated = true, retryUnauthorized = true } = options
    const response = await this.send(path, init, authenticated)

    if (response.status === 401 && authenticated && retryUnauthorized) {
      await this.refreshAccessToken()
      return this.request<T>(path, init, {
        authenticated,
        retryUnauthorized: false,
      })
    }

    if (!response.ok) {
      let payload: ApiErrorPayload = {}
      try {
        payload = ((await response.json()) as ApiErrorPayload)
      } catch {
        // Some infrastructure errors do not include a JSON response.
      }
      throw new ApiError(
        response.status,
        payload.error?.code ?? "INTERNAL_ERROR",
        payload.error?.message ?? "No pudimos completar la solicitud.",
        payload.error?.fields,
        payload.error?.requestId,
      )
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  private send(
    path: string,
    init: RequestInit | undefined,
    authenticated: boolean,
  ) {
    const token = authenticated ? this.getAccessToken() : null
    const hasBody = init?.body !== undefined && init.body !== null
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  }
}
