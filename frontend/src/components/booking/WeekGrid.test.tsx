import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WeekGrid from "./WeekGrid";
import type { Booking } from "../../api/bookings";

const booking: Booking = {
  id: "b1",
  teacher_id: "u1",
  laptop_group_id: "g1",
  teacher: { id: "u1", first_name: "Alice", last_name: "Smith", email: "a@test.com" },
  laptop_group: { id: "g1", building: "Main", floor: 1, laptop_count: 5 },
  booking_date: "2026-04-06", // Monday
  start_time: "09:00:00",
  end_time: "10:00:00",
  notes: null,
  created_at: "",
  updated_at: "",
};

const weekStart = new Date("2026-04-06"); // Monday

describe("WeekGrid", () => {
  it("renders 7 day columns", () => {
    render(
      <WeekGrid
        weekStart={weekStart}
        bookings={[]}
        currentUserId="u1"
        onSlotSelect={vi.fn()}
        onBookingClick={vi.fn()}
      />
    );
    // Each column shows the weekday abbreviation
    expect(screen.getByText("Mon")).toBeTruthy();
    expect(screen.getByText("Sun")).toBeTruthy();
  });

  it("renders the time label 07:00", () => {
    render(
      <WeekGrid
        weekStart={weekStart}
        bookings={[]}
        currentUserId="u1"
        onSlotSelect={vi.fn()}
        onBookingClick={vi.fn()}
      />
    );
    expect(screen.getByText("07:00")).toBeTruthy();
  });

  it("renders the time label 19:00", () => {
    render(
      <WeekGrid
        weekStart={weekStart}
        bookings={[]}
        currentUserId="u1"
        onSlotSelect={vi.fn()}
        onBookingClick={vi.fn()}
      />
    );
    expect(screen.getByText("19:00")).toBeTruthy();
  });

  it("renders a booking block for a booking on Monday", () => {
    render(
      <WeekGrid
        weekStart={weekStart}
        bookings={[booking]}
        currentUserId="u1"
        onSlotSelect={vi.fn()}
        onBookingClick={vi.fn()}
      />
    );
    expect(screen.getByText(/Alice Smith/)).toBeTruthy();
  });

  it("calls onBookingClick when a booking block is clicked", () => {
    const onBookingClick = vi.fn();
    render(
      <WeekGrid
        weekStart={weekStart}
        bookings={[booking]}
        currentUserId="u1"
        onSlotSelect={vi.fn()}
        onBookingClick={onBookingClick}
      />
    );
    screen.getByText(/Alice Smith/).click();
    expect(onBookingClick).toHaveBeenCalledWith(booking);
  });
});
