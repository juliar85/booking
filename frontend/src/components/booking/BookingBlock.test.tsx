import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookingBlock from "./BookingBlock";
import type { Booking } from "../../api/bookings";

const ownBooking: Booking = {
  id: "b1",
  teacher_id: "u1",
  laptop_group_id: "g1",
  teacher: { id: "u1", first_name: "Alice", last_name: "Smith", email: "a@test.com" },
  laptop_group: { id: "g1", building: "Main", floor: 1, laptop_count: 5 },
  booking_date: "2026-04-07",
  start_time: "09:00:00",
  end_time: "10:00:00",
  notes: null,
  created_at: "2026-04-05T00:00:00Z",
  updated_at: "2026-04-05T00:00:00Z",
};

const otherBooking: Booking = {
  ...ownBooking,
  id: "b2",
  teacher_id: "u2",
  teacher: { id: "u2", first_name: "Bob", last_name: "Jones", email: "b@test.com" },
};

describe("BookingBlock", () => {
  it("renders teacher name", () => {
    render(<BookingBlock booking={ownBooking} isOwn onClick={vi.fn()} />);
    expect(screen.getByText(/Alice Smith/)).toBeTruthy();
  });

  it("renders time range", () => {
    render(<BookingBlock booking={ownBooking} isOwn onClick={vi.fn()} />);
    expect(screen.getByText(/09:00/)).toBeTruthy();
  });

  it("renders building and floor", () => {
    render(<BookingBlock booking={ownBooking} isOwn onClick={vi.fn()} />);
    expect(screen.getByText(/Main.*Floor 1/)).toBeTruthy();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<BookingBlock booking={ownBooking} isOwn onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(ownBooking);
  });

  it("own booking has blue background", () => {
    render(<BookingBlock booking={ownBooking} isOwn onClick={vi.fn()} />);
    const el = screen.getByRole("button");
    expect(el.style.backgroundColor).toBe("rgb(59, 130, 246)");
  });

  it("other booking has grey background", () => {
    render(<BookingBlock booking={otherBooking} isOwn={false} onClick={vi.fn()} />);
    const el = screen.getByRole("button");
    expect(el.style.backgroundColor).toBe("rgb(148, 163, 184)");
  });
});
