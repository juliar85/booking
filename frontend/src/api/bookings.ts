import client from "./client";

export interface BookingTeacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface BookingLaptopGroup {
  id: string;
  building: string;
  floor: number;
  laptop_count: number;
}

export interface Booking {
  id: string;
  teacher_id: string;
  laptop_group_id: string;
  teacher: BookingTeacher;
  laptop_group: BookingLaptopGroup;
  booking_date: string; // "YYYY-MM-DD"
  start_time: string;   // "HH:MM:SS"
  end_time: string;     // "HH:MM:SS"
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingPayload {
  laptop_group_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface UpdateBookingPayload {
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export const bookingsApi = {
  list: (weekStart: string, laptopGroupId?: string | null) =>
    client.get<Booking[]>("/bookings", {
      params: {
        week_start: weekStart,
        ...(laptopGroupId ? { laptop_group_id: laptopGroupId } : {}),
      },
    }),
  create: (payload: CreateBookingPayload) =>
    client.post<Booking>("/bookings", payload),
  update: (id: string, payload: UpdateBookingPayload) =>
    client.patch<Booking>(`/bookings/${id}`, payload),
  delete: (id: string) =>
    client.delete<{ message: string }>(`/bookings/${id}`),
};
