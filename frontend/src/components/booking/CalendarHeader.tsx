import React from "react";
import { formatWeekRange } from "./calendarUtils";

interface Props {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function CalendarHeader({ weekStart, onPrev, onNext, onToday }: Props) {
  const rangeLabel = formatWeekRange(weekStart);

  const btnStyle: React.CSSProperties = {
    padding: "4px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <button onClick={onPrev} style={btnStyle} aria-label="Previous week">
        ‹
      </button>
      <button onClick={onNext} style={btnStyle} aria-label="Next week">
        ›
      </button>
      <span style={{ fontWeight: 600, fontSize: 14, color: "#111827", marginLeft: 4 }}>
        {rangeLabel}
      </span>
      <button onClick={onToday} style={{ ...btnStyle, marginLeft: "auto" }}>
        Today
      </button>
    </div>
  );
}
