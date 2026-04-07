import { useCallback, useEffect, useState } from "react";
import type { Booking } from "../../api/bookings";
import { bookingsApi } from "../../api/bookings";
import type { LaptopGroup } from "../../api/laptopGroups";
import { addDays, formatDate, getWeekStart } from "./calendarUtils";
import CalendarHeader from "./CalendarHeader";
import GroupSelector from "./GroupSelector";
import WeekGrid from "./WeekGrid";
import BookingModal, { type ModalState } from "./BookingModal";

interface Props {
  currentUserId: string;
}

export default function BookingCalendar({ currentUserId }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedGroup, setSelectedGroup] = useState<LaptopGroup | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const selectedGroupId = selectedGroup?.id ?? null;

  const fetchBookings = useCallback(() => {
    setLoading(true);
    setError(null);
    bookingsApi
      .list(formatDate(weekStart), selectedGroupId)
      .then((res) => setBookings(res.data))
      .catch(() => setError("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [weekStart, selectedGroupId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    setModalState({
      mode: "create",
      laptopGroupId: selectedGroup?.id ?? null,
      building: selectedGroup?.building ?? null,
      floor: selectedGroup?.floor ?? null,
      date,
      startTime,
      endTime,
    });
  };

  const handleBookingClick = (booking: Booking) => {
    const mode = booking.teacher_id === currentUserId ? "edit" : "view";
    setModalState({ mode, booking });
  };

  const handleModalSuccess = () => {
    setModalState(null);
    fetchBookings();
  };

  return (
    <div>
      <GroupSelector selectedGroupId={selectedGroupId} onGroupSelect={setSelectedGroup} />

      <>
        <CalendarHeader
          weekStart={weekStart}
          onPrev={() => setWeekStart((d) => addDays(d, -7))}
          onNext={() => setWeekStart((d) => addDays(d, 7))}
          onToday={() => setWeekStart(getWeekStart(new Date()))}
        />

        {loading && (
          <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>Loading…</div>
        )}

        {error && !loading && (
          <div style={{ padding: 16, color: "#ef4444", fontSize: 14 }}>{error}</div>
        )}

        {!loading && (
          <WeekGrid
            weekStart={weekStart}
            bookings={bookings}
            currentUserId={currentUserId}
            onSlotSelect={handleSlotSelect}
            onBookingClick={handleBookingClick}
          />
        )}
      </>

      {modalState && (
        <BookingModal
          state={modalState}
          onSuccess={handleModalSuccess}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}
