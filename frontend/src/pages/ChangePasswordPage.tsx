import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";

export default function ChangePasswordPage() {
  const { user, setPasswordChanged } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isForced = user?.passwordIsTemporary ?? false;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await client.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordChanged();
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setError(msg ?? "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>
          {isForced ? "Set your permanent password" : "Change password"}
        </h2>
        {isForced && (
          <p style={styles.info}>
            Your account was created with a temporary password. Please set a new one to continue.
          </p>
        )}
        {error && <p style={styles.error}>{error}</p>}
        <label style={styles.label}>
          Current password
          <input
            style={styles.input}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label style={styles.label}>
          New password
          <input
            style={styles.input}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label style={styles.label}>
          Confirm new password
          <input
            style={styles.input}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save password"}
        </button>
        {!isForced && (
          <button
            type="button"
            style={styles.cancel}
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </button>
        )}
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
    minWidth: "340px",
  },
  title: { margin: 0, fontSize: "1.2rem" },
  info: { margin: 0, color: "#555", fontSize: "0.9rem" },
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
  cancel: {
    padding: "0.6rem",
    background: "transparent",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  error: { color: "#dc2626", margin: 0, fontSize: "0.875rem" },
};
