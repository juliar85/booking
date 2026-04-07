import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBookingDrag } from "./useBookingDrag";
import { TOTAL_SLOTS, slotToTime } from "./calendarUtils";

const COLUMN_HEIGHT = TOTAL_SLOTS * 20; // 20px per slot

function createMouseEvent(type: string, clientY: number): MouseEvent {
  return new MouseEvent(type, { clientY, bubbles: true });
}

function createReactMouseEvent(clientY: number, containerTop = 0): React.MouseEvent<HTMLDivElement> {
  const div = document.createElement("div");
  Object.defineProperty(div, "getBoundingClientRect", {
    value: () => ({ top: containerTop, left: 0, right: 100, bottom: containerTop + COLUMN_HEIGHT, width: 100, height: COLUMN_HEIGHT }),
  });
  return {
    button: 0,
    clientY,
    currentTarget: div,
    preventDefault: vi.fn(),
  } as unknown as React.MouseEvent<HTMLDivElement>;
}

describe("useBookingDrag", () => {
  it("starts with no drag state", () => {
    const { result } = renderHook(() =>
      useBookingDrag({ columnHeight: COLUMN_HEIGHT, onDragComplete: vi.fn() })
    );
    expect(result.current.isDragging).toBe(false);
    expect(result.current.dragSlotRange).toBeNull();
  });

  it("sets isDragging to true on mousedown", () => {
    const { result } = renderHook(() =>
      useBookingDrag({ columnHeight: COLUMN_HEIGHT, onDragComplete: vi.fn() })
    );
    act(() => {
      result.current.onMouseDown(createReactMouseEvent(0));
    });
    expect(result.current.isDragging).toBe(true);
  });

  it("sets initial drag range on mousedown", () => {
    const { result } = renderHook(() =>
      useBookingDrag({ columnHeight: COLUMN_HEIGHT, onDragComplete: vi.fn() })
    );
    // Click at y=20 → slot 1
    act(() => {
      result.current.onMouseDown(createReactMouseEvent(20));
    });
    expect(result.current.dragSlotRange).toEqual({ start: 1, end: 1 });
  });

  it("extends range on mousemove", () => {
    const { result } = renderHook(() =>
      useBookingDrag({ columnHeight: COLUMN_HEIGHT, onDragComplete: vi.fn() })
    );
    act(() => {
      result.current.onMouseDown(createReactMouseEvent(0));
    });
    act(() => {
      window.dispatchEvent(createMouseEvent("mousemove", 60));
    });
    // slot 3 at y=60
    expect(result.current.dragSlotRange?.end).toBe(3);
  });

  it("calls onDragComplete with correct range on mouseup", () => {
    const onDragComplete = vi.fn();
    const { result } = renderHook(() =>
      useBookingDrag({ columnHeight: COLUMN_HEIGHT, onDragComplete })
    );
    act(() => {
      result.current.onMouseDown(createReactMouseEvent(0)); // slot 0
    });
    act(() => {
      window.dispatchEvent(createMouseEvent("mouseup", 60)); // slot 3 → end = 4
    });
    expect(onDragComplete).toHaveBeenCalledOnce();
    const range = onDragComplete.mock.calls[0][0];
    expect(range.startSlot).toBe(0);
    expect(range.endSlot).toBe(4); // +1 because exclusive
    expect(range.startTime).toBe(slotToTime(0));
    expect(range.endTime).toBe(slotToTime(4));
  });

  it("normalises upward drag so startSlot <= endSlot", () => {
    const onDragComplete = vi.fn();
    const { result } = renderHook(() =>
      useBookingDrag({ columnHeight: COLUMN_HEIGHT, onDragComplete })
    );
    // Start at slot 5 (y=100), drag up to slot 2 (y=40)
    act(() => {
      result.current.onMouseDown(createReactMouseEvent(100));
    });
    act(() => {
      window.dispatchEvent(createMouseEvent("mouseup", 40));
    });
    const range = onDragComplete.mock.calls[0][0];
    expect(range.startSlot).toBeLessThanOrEqual(range.endSlot);
  });

  it("clears drag state on mouseup", () => {
    const { result } = renderHook(() =>
      useBookingDrag({ columnHeight: COLUMN_HEIGHT, onDragComplete: vi.fn() })
    );
    act(() => {
      result.current.onMouseDown(createReactMouseEvent(0));
    });
    act(() => {
      window.dispatchEvent(createMouseEvent("mouseup", 40));
    });
    expect(result.current.isDragging).toBe(false);
    expect(result.current.dragSlotRange).toBeNull();
  });

  it("ignores non-left-button mousedown", () => {
    const { result } = renderHook(() =>
      useBookingDrag({ columnHeight: COLUMN_HEIGHT, onDragComplete: vi.fn() })
    );
    const rightClickEvent = { ...createReactMouseEvent(0), button: 2 } as unknown as React.MouseEvent<HTMLDivElement>;
    act(() => {
      result.current.onMouseDown(rightClickEvent);
    });
    expect(result.current.isDragging).toBe(false);
  });
});
