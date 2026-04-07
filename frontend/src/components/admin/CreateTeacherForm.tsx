import { type FormEvent, useState } from "react";
import client from "../../api/client";

interface Props {
  onCreated: () => void;
}

export default function CreateTeacherForm({ onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await client.post("/admin/teachers", {
        email,
        first_name: firstName,
        last_name: lastName,
        temporary_password: tempPassword,
      });
      setEmail("");
      setFirstName("");
      setLastName("");
      setTempPassword("");
      onCreated();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setError(msg ?? "Failed to create teacher");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3 style={styles.heading}>Add teacher</h3>
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.row}>
        <input
          style={styles.input}
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          style={styles.input}
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          style={{ ...styles.input, flex: 2 }}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          placeholder="Temporary password"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
          required
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { marginBottom: "1.5rem" },
  heading: { margin: "0 0 0.75rem 0", fontSize: "1rem" },
  row: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  input: {
    padding: "0.45rem 0.6rem",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    fontSize: "0.9rem",
    flex: 1,
    minWidth: "130px",
  },
  button: {
    padding: "0.45rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  error: { color: "#dc2626", margin: "0 0 0.5rem 0", fontSize: "0.875rem" },
};
