import React, { useEffect, useState } from "react";
import type { LaptopGroup } from "../../api/laptopGroups";
import { laptopGroupsApi } from "../../api/laptopGroups";

interface FormState {
  building: string;
  floor: string;
  laptop_count: string;
}

const emptyForm: FormState = { building: "", floor: "", laptop_count: "" };

export default function LaptopGroupsPage() {
  const [groups, setGroups] = useState<LaptopGroup[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadGroups = () => {
    laptopGroupsApi
      .list()
      .then((res) => setGroups(res.data))
      .catch(() => setError("Failed to load laptop groups"));
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await laptopGroupsApi.create({
        building: form.building.trim(),
        floor: Number(form.floor),
        laptop_count: Number(form.laptop_count),
      });
      setForm(emptyForm);
      loadGroups();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to create group";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setError(null);
    try {
      await laptopGroupsApi.deactivate(id);
      loadGroups();
    } catch {
      setError("Failed to deactivate group");
    }
  };

  const handleEditSave = async (id: string) => {
    setError(null);
    try {
      await laptopGroupsApi.update(id, {
        building: editForm.building || undefined,
        floor: editForm.floor ? Number(editForm.floor) : undefined,
        laptop_count: editForm.laptop_count ? Number(editForm.laptop_count) : undefined,
      });
      setEditId(null);
      loadGroups();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to update group";
      setError(msg);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "5px 8px",
    border: "1px solid #d1d5db",
    borderRadius: 5,
    fontSize: 13,
    width: 110,
  };

  const btnStyle = (variant: "primary" | "danger" | "secondary"): React.CSSProperties => ({
    padding: "5px 12px",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 13,
    backgroundColor:
      variant === "primary" ? "#2563eb" : variant === "danger" ? "#ef4444" : "#e5e7eb",
    color: variant === "secondary" ? "#374151" : "#fff",
  });

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Manage Laptop Groups</h2>

      {/* Create form */}
      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="Building"
          value={form.building}
          onChange={(e) => setForm({ ...form, building: e.target.value })}
          required
          style={inputStyle}
          aria-label="Building name"
        />
        <input
          placeholder="Floor"
          type="number"
          min={0}
          value={form.floor}
          onChange={(e) => setForm({ ...form, floor: e.target.value })}
          required
          style={inputStyle}
          aria-label="Floor number"
        />
        <input
          placeholder="Laptop count"
          type="number"
          min={1}
          value={form.laptop_count}
          onChange={(e) => setForm({ ...form, laptop_count: e.target.value })}
          required
          style={inputStyle}
          aria-label="Laptop count"
        />
        <button type="submit" disabled={loading} style={btnStyle("primary")}>
          Add Group
        </button>
      </form>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "6px 8px" }}>Building</th>
            <th style={{ textAlign: "left", padding: "6px 8px" }}>Floor</th>
            <th style={{ textAlign: "left", padding: "6px 8px" }}>Laptops</th>
            <th style={{ textAlign: "left", padding: "6px 8px" }}>Status</th>
            <th style={{ padding: "6px 8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              {editId === g.id ? (
                <>
                  <td style={{ padding: "4px 8px" }}>
                    <input
                      value={editForm.building}
                      onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                      style={inputStyle}
                      aria-label="Edit building name"
                    />
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <input
                      type="number"
                      min={0}
                      value={editForm.floor}
                      onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                      style={inputStyle}
                      aria-label="Edit floor number"
                    />
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <input
                      type="number"
                      min={1}
                      value={editForm.laptop_count}
                      onChange={(e) =>
                        setEditForm({ ...editForm, laptop_count: e.target.value })
                      }
                      style={inputStyle}
                      aria-label="Edit laptop count"
                    />
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    {g.is_active ? "Active" : "Inactive"}
                  </td>
                  <td style={{ padding: "4px 8px", display: "flex", gap: 4 }}>
                    <button onClick={() => handleEditSave(g.id)} style={btnStyle("primary")}>
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} style={btnStyle("secondary")}>
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ padding: "6px 8px" }}>{g.building}</td>
                  <td style={{ padding: "6px 8px" }}>{g.floor}</td>
                  <td style={{ padding: "6px 8px" }}>{g.laptop_count}</td>
                  <td style={{ padding: "6px 8px" }}>
                    {g.is_active ? (
                      <span style={{ color: "#16a34a" }}>Active</span>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: "6px 8px", display: "flex", gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditId(g.id);
                        setEditForm({
                          building: g.building,
                          floor: String(g.floor),
                          laptop_count: String(g.laptop_count),
                        });
                      }}
                      style={btnStyle("secondary")}
                      aria-label={`Edit ${g.building} floor ${g.floor}`}
                    >
                      Edit
                    </button>
                    {g.is_active && (
                      <button
                        onClick={() => handleDeactivate(g.id)}
                        style={btnStyle("danger")}
                        aria-label={`Deactivate ${g.building} floor ${g.floor}`}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {groups.length === 0 && (
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 12 }}>
          No laptop groups yet. Add one above.
        </p>
      )}
    </div>
  );
}
