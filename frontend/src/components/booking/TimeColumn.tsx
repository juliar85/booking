import React from "react";
import { SLOTS_PER_HOUR, SLOT_END_HOUR, SLOT_START_HOUR } from "./calendarUtils";

const SLOT_HEIGHT_PX = 20;

export default function TimeColumn() {
  const labels: React.ReactNode[] = [];
  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
    const label = `${String(h).padStart(2, "0")}:00`;
    labels.push(
      <div
        key={h}
        style={{
          height: SLOT_HEIGHT_PX * SLOTS_PER_HOUR,
          display: "flex",
          alignItems: "flex-start",
          paddingTop: 2,
          paddingRight: 6,
          color: "#6b7280",
          fontSize: 11,
          whiteSpace: "nowrap",
          boxSizing: "border-box",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 44,
        flexShrink: 0,
        paddingTop: 32, // same as day-header height
      }}
    >
      {labels}
    </div>
  );
}
