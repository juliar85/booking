import { useCallback, useEffect, useState } from "react";
import client from "../../api/client";

interface Teacher {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  password_is_temporary: boolean;
  created_at: string;
}

interface Props {
  refreshTrigger: number;
}

export default function TeacherList({ refreshTrigger }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<Teacher[]>("/admin/teachers");
      setTeachers(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers, refreshTrigger]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete teacher "${name}"?`)) return;
    await client.delete(`/admin/teachers/${id}`);
    fetchTeachers();
  }

  if (loading) return <p>Loading…</p>;
  if (teachers.length === 0) return <p style={{ color: "#6b7280" }}>No teachers yet.</p>;

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Email</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Password</th>
          <th style={styles.th}>Created</th>
          <th style={styles.th}></th>
        </tr>
      </thead>
      <tbody>
        {teachers.map((t) => (
          <tr key={t.id}>
            <td style={styles.td}>{t.first_name} {t.last_name}</td>
            <td style={styles.td}>{t.email}</td>
            <td style={styles.td}>{t.is_active ? "Active" : "Inactive"}</td>
            <td style={styles.td}>
              {t.password_is_temporary ? (
                <span style={styles.badge}>Temporary</span>
              ) : (
                "Set"
              )}
            </td>
            <td style={styles.td}>{new Date(t.created_at).toLocaleDateString()}</td>
            <td style={styles.td}>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDelete(t.id, `${t.first_name} ${t.last_name}`)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
  th: {
    textAlign: "left",
    padding: "0.5rem 0.75rem",
    borderBottom: "2px solid #e5e7eb",
    color: "#374151",
    fontWeight: 600,
  },
  td: { padding: "0.5rem 0.75rem", borderBottom: "1px solid #f3f4f6" },
  badge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.8rem",
  },
  deleteBtn: {
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "4px",
    padding: "2px 10px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};
