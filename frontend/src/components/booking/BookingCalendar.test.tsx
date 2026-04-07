import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mswServer";
import BookingCalendar from "./BookingCalendar";
import { TEACHER_USER } from "../../test/handlers";

const CURRENT_USER_ID = TEACHER_USER.id;

// BOOKING_1 has booking_date "2026-04-07" (Tuesday).
// Pin the clock to that date so BookingCalendar initialises on the right week.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-04-07"));
});
afterAll(() => {
  vi.useRealTimers();
});

describe("BookingCalendar", () => {
  it("renders the GroupSelector", async () => {
    render(<BookingCalendar currentUserId={CURRENT_USER_ID} />);
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /building/i })).toBeTruthy();
    });
  });

  it("fetches bookings once a group is auto-selected", async () => {
    render(<BookingCalendar currentUserId={CURRENT_USER_ID} />);
    await waitFor(() => {
      // After group auto-selection, WeekGrid renders with day columns
      expect(screen.getByText("Mon")).toBeTruthy();
    });
  });

  it("shows the calendar navigation header", async () => {
    render(<BookingCalendar currentUserId={CURRENT_USER_ID} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /previous week/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /next week/i })).toBeTruthy();
      expect(screen.getByText(/Today/i)).toBeTruthy();
    });
  });

  it("displays a booking block from API response", async () => {
    render(<BookingCalendar currentUserId={CURRENT_USER_ID} />);
    await waitFor(() => {
      expect(screen.getByText(/Test Teacher/i)).toBeTruthy();
    });
  });

  it("shows loading indicator during fetch", async () => {
    server.use(
      http.get("http://localhost/api/bookings", async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json([]);
      })
    );
    render(<BookingCalendar currentUserId={CURRENT_USER_ID} />);
    // Loading text appears before response
    await waitFor(() => expect(screen.queryByText(/Loading/i)).toBeTruthy());
  });

  it("navigates to next week on next button click", async () => {
    const user = userEvent.setup();
    render(<BookingCalendar currentUserId={CURRENT_USER_ID} />);
    await waitFor(() => screen.getByRole("button", { name: /next week/i }));
    await user.click(screen.getByRole("button", { name: /next week/i }));
    // After navigation the calendar should still be visible
    await waitFor(() => expect(screen.getByText("Mon")).toBeTruthy());
  });

  it("Today button resets to current week", async () => {
    const user = userEvent.setup();
    render(<BookingCalendar currentUserId={CURRENT_USER_ID} />);
    await waitFor(() => screen.getByText(/Today/i));
    await user.click(screen.getByText(/Today/i));
    await waitFor(() => expect(screen.getByText("Mon")).toBeTruthy());
  });

  it("shows error message when bookings fetch fails", async () => {
    server.use(
      http.get("http://localhost/api/bookings", () =>
        HttpResponse.json({ detail: "error" }, { status: 500 })
      )
    );
    render(<BookingCalendar currentUserId={CURRENT_USER_ID} />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load bookings/i)).toBeTruthy();
    });
  });
});
