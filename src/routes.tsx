import { createBrowserRouter, Navigate } from "react-router"
import LoginPage from "./components/auth/LoginPage"
import ProtectedLayout from "./components/layout/ProtectedLayout"
import DashboardPage from "./pages/DashboardPage"

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    Component: ProtectedLayout,
    children: [{ index: true, Component: DashboardPage }],
  },
  { path: "*", element: <Navigate replace to="/" /> },
])
