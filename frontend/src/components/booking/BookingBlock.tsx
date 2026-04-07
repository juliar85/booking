import type { Booking } from "../../api/bookings";
import { bookingHeightFraction, bookingTopFraction, SLOT_END_HOUR, SLOT_START_HOUR } from "./calendarUtils";

interface Props {
  booking: Booking;
  isOwn: boolean;
  onClick: (booking: Booking) => void;
}

const GRID_HEIGHT_PX = (SLOT_END_HOUR - SLOT_START_HOUR) * 4 * 20; // 52 slots × 20px

export default function BookingBlock({ booking, isOwn, onClick }: Props) {
  const topFrac = bookingTopFraction(booking.start_time);
  const heightFrac = bookingHeightFraction(booking.start_time, booking.end_time);
  const topPx = topFrac * GRID_HEIGHT_PX;
  const heightPx = Math.max(heightFrac * GRID_HEIGHT_PX, 18);

  const startLabel = booking.start_time.slice(0, 5);
  const endLabel = booking.end_time.slice(0, 5);

  return (
    <div
      role="button"
      aria-label={`Booking by ${booking.teacher.first_name} ${booking.teacher.last_name}`}
      onClick={() => onClick(booking)}
      style={{
        position: "absolute",
        top: topPx,
        height: heightPx,
        left: 2,
        right: 2,
        backgroundColor: isOwn ? "#3b82f6" : "#94a3b8",
        color: "#fff",
        borderRadius: 4,
        padding: "2px 4px",
        cursor: "pointer",
        overflow: "hidden",
        fontSize: 11,
        lineHeight: "14px",
        zIndex: 1,
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {booking.teacher.first_name} {booking.teacher.last_name}
      </div>
      <div style={{ opacity: 0.85 }}>{startLabel}–{endLabel}</div>
      <div style={{ opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {booking.laptop_group.building}, Floor {booking.laptop_group.floor}
      </div>
    </div>
  );
}
