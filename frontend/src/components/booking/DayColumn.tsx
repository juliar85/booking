import type { Booking } from "../../api/bookings";
import { formatDate, TOTAL_SLOTS } from "./calendarUtils";
import BookingBlock from "./BookingBlock";
import { useBookingDrag, type DragRange } from "./useBookingDrag";

const SLOT_HEIGHT_PX = 20;
const COLUMN_HEIGHT_PX = TOTAL_SLOTS * SLOT_HEIGHT_PX;
const HEADER_HEIGHT_PX = 32;

interface Props {
  date: Date;
  bookings: Booking[];
  currentUserId: string;
  onSlotSelect: (date: string, startTime: string, endTime: string) => void;
  onBookingClick: (booking: Booking) => void;
  isToday: boolean;
}

export default function DayColumn({
  date,
  bookings,
  currentUserId,
  onSlotSelect,
  onBookingClick,
  isToday,
}: Props) {
  const { weekday, dayMonth } = {
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
    dayMonth: `${date.getDate()} ${date.toLocaleDateString("en-GB", { month: "short" })}`,
  };

  const handleDragComplete = (range: DragRange) => {
    onSlotSelect(formatDate(date), range.startTime, range.endTime);
  };

  const { isDragging, dragSlotRange, onMouseDown } = useBookingDrag({
    columnHeight: COLUMN_HEIGHT_PX,
    onDragComplete: handleDragComplete,
  });

  const hourLines: React.ReactNode[] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    hourLines.push(
      <div
        key={i}
        style={{
          height: SLOT_HEIGHT_PX,
          borderTop: i % 4 === 0 ? "1px solid #e5e7eb" : "1px solid #f3f4f6",
          boxSizing: "border-box",
        }}
      />
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, borderLeft: "1px solid #e5e7eb" }}>
      {/* Day header */}
      <div
        style={{
          height: HEADER_HEIGHT_PX,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          backgroundColor: isToday ? "#eff6ff" : "transparent",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 2,
          userSelect: "none",
        }}
      >
        <span style={{ color: "#6b7280", fontWeight: 500 }}>{weekday}</span>
        <span
          style={{
            fontWeight: isToday ? 700 : 400,
            color: isToday ? "#2563eb" : "#111827",
          }}
        >
          {dayMonth}
        </span>
      </div>

      {/* Grid area */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "relative",
          height: COLUMN_HEIGHT_PX,
          cursor: "crosshair",
          userSelect: "none",
        }}
      >
        {/* Hour lines background */}
        {hourLines}

        {/* Drag selection highlight */}
        {isDragging && dragSlotRange && (
          <div
            style={{
              position: "absolute",
              top: dragSlotRange.start * SLOT_HEIGHT_PX,
              height: (dragSlotRange.end - dragSlotRange.start + 1) * SLOT_HEIGHT_PX,
              left: 0,
              right: 0,
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              border: "1px dashed #3b82f6",
              zIndex: 2,
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
          />
        )}

        {/* Booking blocks */}
        {bookings.map((b) => (
          <BookingBlock
            key={b.id}
            booking={b}
            isOwn={b.teacher_id === currentUserId}
            onClick={onBookingClick}
          />
        ))}
      </div>
    </div>
  );
}
