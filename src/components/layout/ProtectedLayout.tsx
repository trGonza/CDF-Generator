import { Navigate, Outlet, useLocation } from "react-router"
import { useAuth } from "../../auth/useAuth"

export default function ProtectedLayout() {
  const { sessionMessage, status } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return (
      <main className="session-loading">
        <div className="loading-mark">C</div>
        <p>Recuperando sesión…</p>
      </main>
    )
  }

  if (status === "anonymous") {
    return (
      <Navigate
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          message: sessionMessage,
        }}
        to="/login"
      />
    )
  }

  return <Outlet />
}
