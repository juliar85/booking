import { useCallback, useRef, useState } from "react";
import { TOTAL_SLOTS, slotToTime } from "./calendarUtils";

export interface DragRange {
  startSlot: number;
  endSlot: number; // exclusive — booking covers [startSlot, endSlot)
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

interface UseBookingDragOptions {
  /** Total pixel height of the grid column (all slots combined). */
  columnHeight: number;
  onDragComplete: (range: DragRange) => void;
}

interface UseBookingDragReturn {
  isDragging: boolean;
  dragSlotRange: { start: number; end: number } | null;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function pixelToSlot(y: number, columnHeight: number): number {
  const fraction = Math.max(0, Math.min(1, y / columnHeight));
  return Math.min(TOTAL_SLOTS - 1, Math.floor(fraction * TOTAL_SLOTS));
}

export function useBookingDrag({
  columnHeight,
  onDragComplete,
}: UseBookingDragOptions): UseBookingDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSlotRange, setDragSlotRange] = useState<{ start: number; end: number } | null>(null);

  const anchorSlotRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getRelativeY = useCallback((e: MouseEvent, container: HTMLDivElement): number => {
    const rect = container.getBoundingClientRect();
    return e.clientY - rect.top;
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const container = e.currentTarget as HTMLDivElement;
      containerRef.current = container;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const slot = pixelToSlot(y, columnHeight);

      anchorSlotRef.current = slot;
      setIsDragging(true);
      setDragSlotRange({ start: slot, end: slot });

      const onMouseMove = (ev: MouseEvent) => {
        if (anchorSlotRef.current === null || !containerRef.current) return;
        const relY = getRelativeY(ev, containerRef.current);
        const currentSlot = pixelToSlot(relY, columnHeight);
        const anchor = anchorSlotRef.current;
        setDragSlotRange({
          start: Math.min(anchor, currentSlot),
          end: Math.max(anchor, currentSlot),
        });
      };

      const onMouseUp = (ev: MouseEvent) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        if (anchorSlotRef.current === null || !containerRef.current) {
          setIsDragging(false);
          setDragSlotRange(null);
          return;
        }

        const relY = getRelativeY(ev, containerRef.current);
        const currentSlot = pixelToSlot(relY, columnHeight);
        const anchor = anchorSlotRef.current;
        const startSlot = Math.min(anchor, currentSlot);
        const endSlot = Math.max(anchor, currentSlot) + 1; // +1 because end is exclusive

        anchorSlotRef.current = null;
        containerRef.current = null;
        setIsDragging(false);
        setDragSlotRange(null);

        onDragComplete({
          startSlot,
          endSlot,
          startTime: slotToTime(startSlot),
          endTime: slotToTime(endSlot),
        });
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [columnHeight, getRelativeY, onDragComplete]
  );

  return { isDragging, dragSlotRange, onMouseDown };
}
