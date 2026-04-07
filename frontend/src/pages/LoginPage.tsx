import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await client.post("/auth/login", { email, password });
      const { access_token, password_is_temporary, role, id, email: userEmail, first_name, last_name } = res.data;
      login(access_token, {
        id,
        email: userEmail,
        firstName: first_name,
        lastName: last_name,
        role,
        passwordIsTemporary: password_is_temporary,
      });
      if (password_is_temporary) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>TKVG букинг</h2>
        <h3 style={styles.subtitle}>Sign in</h3>
        {error && <p style={styles.error}>{error}</p>}
        <label style={styles.label}>
          Email
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
  },
  form: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    minWidth: "320px",
  },
  title: { margin: 0, fontSize: "1.4rem", textAlign: "center" },
  subtitle: { margin: 0, fontWeight: 400, color: "#555", textAlign: "center" },
  label: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.9rem" },
  input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "1rem" },
  button: {
    padding: "0.6rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  error: { color: "#dc2626", margin: 0, fontSize: "0.875rem" },
};
