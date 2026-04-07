import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mswServer";
import BookingModal from "./BookingModal";
import type { ModalState } from "./BookingModal";
import { BOOKING_1, LAPTOP_GROUP_1 } from "../../test/handlers";
import type { Booking } from "../../api/bookings";

const booking: Booking = {
  ...BOOKING_1,
  teacher: {
    id: BOOKING_1.teacher.id,
    first_name: BOOKING_1.teacher.first_name,
    last_name: BOOKING_1.teacher.last_name,
    email: BOOKING_1.teacher.email,
  },
  laptop_group: {
    id: BOOKING_1.laptop_group.id,
    building: BOOKING_1.laptop_group.building,
    floor: BOOKING_1.laptop_group.floor,
    laptop_count: BOOKING_1.laptop_group.laptop_count,
  },
};

// Pre-filled: specific group already selected in the calendar
const createStateWithGroup: ModalState = {
  mode: "create",
  laptopGroupId: LAPTOP_GROUP_1.id,
  building: LAPTOP_GROUP_1.building,
  floor: LAPTOP_GROUP_1.floor,
  date: "2026-04-07",
  startTime: "09:00",
  endTime: "10:00",
};

// "All buildings" was active — no group pre-selected
const createStateNoGroup: ModalState = {
  mode: "create",
  laptopGroupId: null,
  building: null,
  floor: null,
  date: "2026-04-07",
  startTime: "09:00",
  endTime: "10:00",
};

const editState: ModalState = { mode: "edit", booking };
const viewState: ModalState = { mode: "view", booking };

describe("BookingModal — create mode (group pre-selected)", () => {
  it("shows the pre-filled date and time", () => {
    render(<BookingModal state={createStateWithGroup} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/2026-04-07/)).toBeTruthy();
    expect(screen.getByText(/09:00/)).toBeTruthy();
  });

  it("shows building selector pre-filled with the selected building", async () => {
    render(<BookingModal state={createStateWithGroup} onSuccess={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => {
      const select = screen.getByRole("combobox", { name: /building/i });
      expect((select as HTMLSelectElement).value).toBe(LAPTOP_GROUP_1.building);
    });
  });

  it("renders the notes textarea", () => {
    render(<BookingModal state={createStateWithGroup} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Add a note/i)).toBeTruthy();
  });

  it("calls POST /bookings on submit", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<BookingModal state={createStateWithGroup} onSuccess={onSuccess} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("shows server error inline on 409", async () => {
    server.use(
      http.post("http://localhost/api/bookings", () =>
        HttpResponse.json({ detail: "This floor is already booked during the requested time" }, { status: 409 })
      )
    );
    const user = userEvent.setup();
    render(<BookingModal state={createStateWithGroup} onSuccess={vi.fn()} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/already booked/i)).toBeTruthy();
    });
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<BookingModal state={createStateWithGroup} onSuccess={vi.fn()} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("BookingModal — create mode (no group, All buildings)", () => {
  it("shows empty building selector", async () => {
    render(<BookingModal state={createStateNoGroup} onSuccess={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => {
      const select = screen.getByRole("combobox", { name: /building/i });
      expect((select as HTMLSelectElement).value).toBe("");
    });
  });

  it("shows validation error when submitting without selecting a building", async () => {
    const user = userEvent.setup();
    render(<BookingModal state={createStateNoGroup} onSuccess={vi.fn()} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /create/i }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/select a building/i)).toBeTruthy();
  });

  it("allows submitting after selecting a building and floor", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<BookingModal state={createStateNoGroup} onSuccess={onSuccess} onClose={vi.fn()} />);
    // Wait for the building option to appear (groups loaded from API)
    await waitFor(() =>
      expect(screen.getByRole("option", { name: LAPTOP_GROUP_1.building })).toBeTruthy()
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /building/i }),
      LAPTOP_GROUP_1.building
    );
    await waitFor(() => screen.getByRole("combobox", { name: /floor/i }));
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe("BookingModal — edit mode", () => {
  it("shows pre-filled booking time", () => {
    render(<BookingModal state={editState} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/09:00/)).toBeTruthy();
  });

  it("shows building and floor", () => {
    render(<BookingModal state={editState} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Main Building.*Floor 1/)).toBeTruthy();
  });

  it("shows a Delete button", () => {
    render(<BookingModal state={editState} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
  });

  it("calls PATCH /bookings/:id on save", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<BookingModal state={editState} onSuccess={onSuccess} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("calls DELETE /bookings/:id and then onSuccess", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<BookingModal state={editState} onSuccess={onSuccess} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe("BookingModal — view mode (other teacher's booking)", () => {
  it("shows teacher name", () => {
    render(<BookingModal state={viewState} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Test Teacher/i)).toBeTruthy();
  });

  it("shows building and floor", () => {
    render(<BookingModal state={viewState} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Main Building.*Floor 1/)).toBeTruthy();
  });

  it("does not show edit or delete buttons", () => {
    render(<BookingModal state={viewState} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("shows a Close button", () => {
    render(<BookingModal state={viewState} onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /close/i })).toBeTruthy();
  });
});
