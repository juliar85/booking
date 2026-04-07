import React, { useEffect, useState } from "react";
import type { Booking, CreateBookingPayload, UpdateBookingPayload } from "../../api/bookings";
import { bookingsApi } from "../../api/bookings";
import type { LaptopGroup } from "../../api/laptopGroups";
import { laptopGroupsApi } from "../../api/laptopGroups";

interface CreateState {
  mode: "create";
  laptopGroupId: string | null;
  building: string | null;
  floor: number | null;
  date: string;
  startTime: string;
  endTime: string;
}

interface EditState {
  mode: "edit" | "view";
  booking: Booking;
}

export type ModalState = CreateState | EditState;

interface Props {
  state: ModalState;
  onSuccess: () => void;
  onClose: () => void;
}

export default function BookingModal({ state, onSuccess, onClose }: Props) {
  const isCreate = state.mode === "create";
  const isEdit = state.mode === "edit";
  const isView = state.mode === "view";

  const initialNotes = !isCreate ? (state as EditState).booking.notes ?? "" : "";
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Building/floor selection in create mode
  const [groups, setGroups] = useState<LaptopGroup[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>(
    isCreate ? (state as CreateState).building ?? "" : ""
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    isCreate ? (state as CreateState).laptopGroupId ?? "" : ""
  );

  useEffect(() => {
    if (!isCreate) return;
    laptopGroupsApi.list().then((res) => {
      setGroups(res.data);
      // If pre-filled from calendar filter, keep the selection; otherwise leave blank
    });
  }, [isCreate]);

  const buildings = Array.from(new Set(groups.map((g) => g.building))).sort();
  const floorsForBuilding = groups
    .filter((g) => g.building === selectedBuilding)
    .sort((a, b) => a.floor - b.floor);

  const handleBuildingChange = (building: string) => {
    setSelectedBuilding(building);
    // Auto-select first floor of the chosen building
    const firstFloor = groups
      .filter((g) => g.building === building)
      .sort((a, b) => a.floor - b.floor)[0];
    setSelectedGroupId(firstFloor?.id ?? "");
  };

  const displayDate = isCreate ? (state as CreateState).date : (state as EditState).booking.booking_date;
  const displayStart = isCreate
    ? (state as CreateState).startTime
    : (state as EditState).booking.start_time.slice(0, 5);
  const displayEnd = isCreate
    ? (state as CreateState).endTime
    : (state as EditState).booking.end_time.slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isCreate && !selectedGroupId) {
      setError("Please select a building and floor");
      return;
    }
    setLoading(true);
    try {
      if (isCreate) {
        const s = state as CreateState;
        const payload: CreateBookingPayload = {
          laptop_group_id: selectedGroupId,
          booking_date: s.date,
          start_time: s.startTime + ":00",
          end_time: s.endTime + ":00",
          notes: notes.trim() || undefined,
        };
        await bookingsApi.create(payload);
      } else if (isEdit) {
        const s = state as EditState;
        const payload: UpdateBookingPayload = {
          notes: notes.trim() || undefined,
        };
        await bookingsApi.update(s.booking.id, payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    const s = state as EditState;
    setLoading(true);
    setError(null);
    try {
      await bookingsApi.delete(s.booking.id);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to delete";
      setError(msg);
      setLoading(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 10,
    padding: "24px 28px",
    width: 380,
    maxWidth: "90vw",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    boxSizing: "border-box",
    backgroundColor: "#f9fafb",
    color: "#374151",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "8px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  };

  const btnDanger: React.CSSProperties = {
    padding: "8px 18px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  };

  const btnSecondary: React.CSSProperties = {
    padding: "8px 18px",
    background: "transparent",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 4,
  };

  const title = isCreate ? "New Booking" : isEdit ? "Edit Booking" : "Booking Details";

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={title}>
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>{title}</h3>

        {isView && (
          <div style={{ marginBottom: 12, fontSize: 14, color: "#374151" }}>
            <div>
              <strong>Teacher:</strong>{" "}
              {(state as EditState).booking.teacher.first_name}{" "}
              {(state as EditState).booking.teacher.last_name}
            </div>
          </div>
        )}

        {/* Edit/View mode: show location as static text */}
        {!isCreate && (
          <div style={{ marginBottom: 12, fontSize: 14, color: "#374151" }}>
            <div>
              <strong>Building:</strong>{" "}
              {(state as EditState).booking.laptop_group.building}, Floor{" "}
              {(state as EditState).booking.laptop_group.floor}
            </div>
            <div><strong>Date:</strong> {displayDate}</div>
            <div><strong>Time:</strong> {displayStart} – {displayEnd}</div>
          </div>
        )}

        {/* Create mode: show date/time as static, building/floor as selectors */}
        {isCreate && (
          <div style={{ marginBottom: 12, fontSize: 14, color: "#374151" }}>
            <div><strong>Date:</strong> {displayDate}</div>
            <div style={{ marginBottom: 12 }}><strong>Time:</strong> {displayStart} – {displayEnd}</div>
          </div>
        )}

        {!isView ? (
          <form onSubmit={handleSubmit}>
            {isCreate && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Building</label>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => handleBuildingChange(e.target.value)}
                    style={selectStyle}
                    aria-label="Select building"
                  >
                    <option value="">— select building —</option>
                    {buildings.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {selectedBuilding && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Floor</label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      style={selectStyle}
                      aria-label="Select floor"
                    >
                      {floorsForBuilding.map((g) => (
                        <option key={g.id} value={g.id}>
                          Floor {g.floor} ({g.laptop_count} laptops)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Add a note..."
              />
            </div>

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

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  style={btnDanger}
                  aria-label="Delete booking"
                >
                  Delete
                </button>
              )}
              <button type="button" onClick={onClose} style={btnSecondary} disabled={loading}>
                Cancel
              </button>
              <button type="submit" style={btnPrimary} disabled={loading}>
                {loading ? "Saving…" : isCreate ? "Create" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnSecondary}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
