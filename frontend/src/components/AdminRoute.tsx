import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth";

export function AdminRoute() {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? <Outlet /> : <Navigate to="/tasks" replace />;
}
