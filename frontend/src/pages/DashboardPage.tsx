import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CreateTeacherForm from "../components/admin/CreateTeacherForm";
import TeacherList from "../components/admin/TeacherList";
import BookingCalendar from "../components/booking/BookingCalendar";
import LaptopGroupsPage from "./admin/LaptopGroupsPage";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";
  const [showLaptopGroups, setShowLaptopGroups] = useState(false);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.brand}>TKVG букинг</span>
        <div style={styles.headerRight}>
          <span style={styles.username}>{displayName}</span>
          <button
            style={styles.changePassBtn}
            onClick={() => navigate("/change-password")}
          >
            Change password
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {user?.role === "admin" && (
          <>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Teacher accounts</h2>
              <CreateTeacherForm onCreated={() => setRefreshTrigger((n) => n + 1)} />
              <TeacherList refreshTrigger={refreshTrigger} />
            </section>
            <section style={{ ...styles.card, marginTop: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Laptop groups</h2>
                <button
                  style={styles.changePassBtn}
                  onClick={() => setShowLaptopGroups((v) => !v)}
                >
                  {showLaptopGroups ? "Hide" : "Manage"}
                </button>
              </div>
              {showLaptopGroups && <LaptopGroupsPage />}
            </section>
          </>
        )}

        {user?.role === "teacher" && (
          <section style={{ ...styles.card, maxWidth: "none" }}>
            <h2 style={styles.sectionTitle}>TKVG букинг</h2>
            <BookingCalendar currentUserId={user.id} />
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f3f4f6" },
  header: {
    background: "#fff",
    padding: "0.75rem 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  brand: { fontWeight: 700, fontSize: "1.1rem" },
  headerRight: { display: "flex", alignItems: "center", gap: "1rem" },
  username: { color: "#374151", fontSize: "0.9rem" },
  logoutBtn: {
    padding: "0.35rem 0.9rem",
    background: "transparent",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  changePassBtn: {
    padding: "0.35rem 0.9rem",
    background: "transparent",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  main: { padding: "2rem 1.5rem" },
  card: {
    background: "#fff",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
    maxWidth: "900px",
  },
  sectionTitle: { margin: "0 0 1.25rem 0", fontSize: "1.1rem" },
};
