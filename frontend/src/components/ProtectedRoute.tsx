import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Box className="page-loading"><CircularProgress /></Box>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
