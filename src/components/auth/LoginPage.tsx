import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router"
import { useAuth } from "../../auth/useAuth"
import { API_CONFIG } from "../../config/api"
import { ApiError } from "../../infrastructure/http/ApiClient"
import Icon from "../ui/Icon"

type FieldErrors = {
  username?: string
  password?: string
}

function validate(username: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!username) errors.username = "El usuario es obligatorio."
  else if (username.length < 3) errors.username = "Mínimo 3 caracteres."
  else if (username.length > 50) errors.username = "Máximo 50 caracteres."
  else if (!/^[a-z0-9._-]+$/.test(username)) {
    errors.username = "Solo letras, números, punto, guion y guion bajo."
  }
  if (!password) errors.password = "La contraseña es obligatoria."
  else if (password.length > 128) errors.password = "Máximo 128 caracteres."
  return errors
}

export default function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState(
    API_CONFIG.useRemoteAuth ? "" : "CDF2026",
  )
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState("")
  const [requestId, setRequestId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === "loading") {
    return (
      <main className="session-loading">
        <div className="loading-mark">C</div>
        <p>Recuperando sesión…</p>
      </main>
    )
  }

  if (status === "authenticated") return <Navigate replace to="/" />

  function validateField(field: keyof FieldErrors) {
    const next = validate(username.trim().toLowerCase(), password)
    setErrors((current) => ({ ...current, [field]: next[field] }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const normalizedUsername = username.trim().toLowerCase()
    const validation = validate(normalizedUsername, password)
    setErrors(validation)
    if (Object.keys(validation).length) return

    setBanner("")
    setRequestId("")
    setIsSubmitting(true)
    try {
      await login(normalizedUsername, password)
      const destination =
        (location.state as { from?: string } | null)?.from ?? "/"
      navigate(destination, { replace: true })
    } catch (reason) {
      setPassword("")
      if (reason instanceof ApiError) {
        if (reason.code === "VALIDATION_ERROR") {
          setErrors(reason.fields)
        } else if (
          reason.code === "INVALID_CREDENTIALS" ||
          reason.status === 401
        ) {
          setBanner("Usuario o contraseña incorrectos.")
        } else if (
          reason.code === "TOO_MANY_REQUESTS" ||
          reason.status === 429
        ) {
          setBanner("Demasiadas solicitudes. Intenta más tarde.")
        } else {
          setBanner("No pudimos conectar con el servidor. Intenta de nuevo.")
          setRequestId(reason.requestId ?? "")
        }
      } else {
        setBanner(
          reason instanceof Error && reason.message.includes("incorrectos")
            ? "Usuario o contraseña incorrectos."
            : "No pudimos conectar con el servidor. Intenta de nuevo.",
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="brand-mark">C</div>
          <div className="brand-copy">
            <strong>C Control</strong>
            <span>Constancias de fumigación</span>
          </div>
        </div>
        <h1 id="login-title">Iniciar sesión</h1>
        <p>Accede a la gestión documental de tu flota.</p>

        {(location.state as { message?: string } | null)?.message && (
          <div className="login-info">
            {(location.state as { message?: string }).message}
          </div>
        )}
        {banner && (
          <div className="login-error" role="alert">
            {banner}
            {requestId && <small>Referencia: {requestId}</small>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            <span>Usuario</span>
            <input
              autoCapitalize="none"
              autoComplete="username"
              autoFocus
              disabled={isSubmitting}
              placeholder="usuario"
              value={username}
              onBlur={() => validateField("username")}
              onChange={(event) => setUsername(event.target.value)}
            />
            {errors.username && (
              <small className="field-error">{errors.username}</small>
            )}
          </label>
          <label>
            <span>Contraseña</span>
            <div className="password-field">
              <input
                autoComplete="current-password"
                disabled={isSubmitting}
                type={showPassword ? "text" : "password"}
                value={password}
                onBlur={() => validateField("password")}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                disabled={isSubmitting}
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} />
              </button>
            </div>
            {errors.password && (
              <small className="field-error">{errors.password}</small>
            )}
          </label>
          <button
            className="primary-button login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="button-spinner" />}
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <small className="login-security-note">
          Por seguridad, varios intentos fallidos bloquean la cuenta
          temporalmente.
        </small>
        <footer>Versión 1.0 · Soporte C Control</footer>
      </section>
    </main>
  )
}
