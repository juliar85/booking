import type { Booking } from "../../api/bookings";
import { formatDate, getWeekDays, isSameDay } from "./calendarUtils";
import TimeColumn from "./TimeColumn";
import DayColumn from "./DayColumn";

interface Props {
  weekStart: Date;
  bookings: Booking[];
  currentUserId: string;
  onSlotSelect: (date: string, startTime: string, endTime: string) => void;
  onBookingClick: (booking: Booking) => void;
}

export default function WeekGrid({
  weekStart,
  bookings,
  currentUserId,
  onSlotSelect,
  onBookingClick,
}: Props) {
  const days = getWeekDays(weekStart);
  const today = new Date();

  return (
    <div
      style={{
        display: "flex",
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: "70vh",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        backgroundColor: "#fff",
      }}
    >
      <TimeColumn />
      {days.map((day) => {
        const dayStr = formatDate(day);
        const dayBookings = bookings.filter((b) => b.booking_date === dayStr);
        return (
          <DayColumn
            key={dayStr}
            date={day}
            bookings={dayBookings}
            currentUserId={currentUserId}
            onSlotSelect={onSlotSelect}
            onBookingClick={onBookingClick}
            isToday={isSameDay(day, today)}
          />
        );
      })}
    </div>
  );
}
