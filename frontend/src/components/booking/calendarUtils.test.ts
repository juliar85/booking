import { describe, expect, it } from "vitest";
import {
  TOTAL_SLOTS,
  addDays,
  bookingHeightFraction,
  bookingTopFraction,
  formatDate,
  formatWeekRange,
  getWeekDays,
  getWeekStart,
  isSameDay,
  slotToTime,
  timeToMinutes,
  timeToSlot,
} from "./calendarUtils";

describe("slotToTime", () => {
  it("converts slot 0 to 07:00", () => expect(slotToTime(0)).toBe("07:00"));
  it("converts slot 1 to 07:15", () => expect(slotToTime(1)).toBe("07:15"));
  it("converts slot 4 to 08:00", () => expect(slotToTime(4)).toBe("08:00"));
  it("converts last slot (51) to 19:45", () => expect(slotToTime(51)).toBe("19:45"));
  it("converts slot 8 to 09:00", () => expect(slotToTime(8)).toBe("09:00"));
});

describe("timeToSlot", () => {
  it("converts 07:00 to slot 0", () => expect(timeToSlot("07:00")).toBe(0));
  it("converts 07:15 to slot 1", () => expect(timeToSlot("07:15")).toBe(1));
  it("converts 08:00 to slot 4", () => expect(timeToSlot("08:00")).toBe(4));
  it("converts 09:00:00 to slot 8", () => expect(timeToSlot("09:00:00")).toBe(8));
  it("round-trips with slotToTime", () => {
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      expect(timeToSlot(slotToTime(i))).toBe(i);
    }
  });
});

describe("getWeekStart", () => {
  it("Monday stays the same", () => {
    const monday = new Date("2026-04-06"); // Monday
    expect(formatDate(getWeekStart(monday))).toBe("2026-04-06");
  });
  it("Wednesday returns the Monday of that week", () => {
    const wednesday = new Date("2026-04-08");
    expect(formatDate(getWeekStart(wednesday))).toBe("2026-04-06");
  });
  it("Sunday returns the Monday 6 days before", () => {
    const sunday = new Date("2026-04-12");
    expect(formatDate(getWeekStart(sunday))).toBe("2026-04-06");
  });
});

describe("getWeekDays", () => {
  it("returns 7 days", () => {
    const weekStart = new Date("2026-04-06");
    expect(getWeekDays(weekStart)).toHaveLength(7);
  });
  it("first day is the weekStart", () => {
    const weekStart = new Date("2026-04-06");
    const days = getWeekDays(weekStart);
    expect(formatDate(days[0])).toBe("2026-04-06");
  });
  it("last day is Sunday", () => {
    const weekStart = new Date("2026-04-06");
    const days = getWeekDays(weekStart);
    expect(formatDate(days[6])).toBe("2026-04-12");
  });
});

describe("addDays", () => {
  it("adds 7 days", () => {
    const d = new Date("2026-04-06");
    expect(formatDate(addDays(d, 7))).toBe("2026-04-13");
  });
  it("does not mutate original date", () => {
    const d = new Date("2026-04-06");
    addDays(d, 3);
    expect(formatDate(d)).toBe("2026-04-06");
  });
});

describe("formatDate", () => {
  it("formats a date correctly", () => {
    expect(formatDate(new Date("2026-04-07"))).toBe("2026-04-07");
  });
  it("pads month and day", () => {
    expect(formatDate(new Date("2026-01-05"))).toBe("2026-01-05");
  });
});

describe("formatWeekRange", () => {
  it("includes both ends", () => {
    const range = formatWeekRange(new Date("2026-04-06"));
    expect(range).toContain("6 Apr");
    expect(range).toContain("12 Apr");
  });
});

describe("timeToMinutes", () => {
  it("converts 09:00 to 540", () => expect(timeToMinutes("09:00")).toBe(540));
  it("converts 09:30 to 570", () => expect(timeToMinutes("09:30")).toBe(570));
  it("converts 09:00:00 correctly", () => expect(timeToMinutes("09:00:00")).toBe(540));
});

describe("bookingTopFraction", () => {
  it("07:00 is at the top (0)", () => {
    expect(bookingTopFraction("07:00")).toBe(0);
  });
  it("19:45 is near the bottom", () => {
    expect(bookingTopFraction("19:45")).toBeCloseTo(0.9808, 3);
  });
  it("13:00 is at 46/78 ≈ 0.461...", () => {
    // (13-7)*60 = 360 minutes from start; total = 780 minutes
    expect(bookingTopFraction("13:00")).toBeCloseTo(360 / 780, 5);
  });
});

describe("bookingHeightFraction", () => {
  it("one hour slot has correct fraction", () => {
    // 60 / 780 ≈ 0.0769
    expect(bookingHeightFraction("09:00", "10:00")).toBeCloseTo(60 / 780, 5);
  });
  it("15-minute slot has correct fraction", () => {
    expect(bookingHeightFraction("09:00", "09:15")).toBeCloseTo(15 / 780, 5);
  });
});

describe("isSameDay", () => {
  it("same date is true", () => {
    expect(isSameDay(new Date("2026-04-07"), new Date("2026-04-07"))).toBe(true);
  });
  it("different dates is false", () => {
    expect(isSameDay(new Date("2026-04-07"), new Date("2026-04-08"))).toBe(false);
  });
});
