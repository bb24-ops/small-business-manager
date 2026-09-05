import { useState, type FormEvent } from "react";
import { LockRounded } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../auth";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to={user.role === "ADMIN" ? "/dashboard" : "/tasks"} replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setSubmitting(true);
    try { await login(email, password); navigate("/"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Prijavljivanje nije uspelo."); }
    finally { setSubmitting(false); }
  };
  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
    <Paper component="form" onSubmit={submit} elevation={0} sx={{ width: "100%", maxWidth: 430, p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider", borderRadius: 4 }}>
      <Stack spacing={3} sx={{ alignItems: "stretch" }}>
        <Avatar sx={{ mx: "auto", bgcolor: "primary.main" }}><LockRounded /></Avatar>
        <Box sx={{ textAlign: "center" }}><Typography variant="h4">Prijavljivanje</Typography><Typography color="text.secondary">Small Business Manager</Typography></Box>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email adresa" type="email" required autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Lozinka" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>{submitting ? <CircularProgress size={24} color="inherit" /> : "Prijavi se"}</Button>
      </Stack>
    </Paper>
  </Box>;
}
