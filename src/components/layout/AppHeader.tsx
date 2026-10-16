import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../../auth/useAuth"
import Icon from "../ui/Icon"

const ROLE_NAMES = {
  admin: "Administrador",
  operator: "Operador",
  viewer: "Consulta",
}

export default function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!user) return null
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="topbar">
      <Link className="brand-link" to="/">
        <div className="brand-mark">C</div>
        <div className="brand-copy">
          <strong>C Control</strong>
          <span>Control integral de plagas</span>
        </div>
      </Link>
      <div className="topbar-divider" />
      <div className="product-name">
        <span>Sistema de constancias</span>
        <small>Generación y control de CDF</small>
      </div>
      <div className="user-menu">
        <button
          aria-expanded={open}
          className="user-menu-trigger"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="user-avatar">{initials}</span>
          <span>
            {user.name}
            <small>@{user.username}</small>
          </span>
          <span className="menu-caret">⌄</span>
        </button>
        {open && (
          <div className="user-menu-popover">
            <div className="user-menu-summary">
              <strong>{user.name}</strong>
              <span>@{user.username}</span>
              <small>{ROLE_NAMES[user.role]}</small>
            </div>
            <button type="button" onClick={handleLogout}>
              <Icon name="logout" /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
