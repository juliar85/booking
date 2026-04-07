import { http, HttpResponse } from "msw";

export const LAPTOP_GROUP_1 = {
  id: "10000000-0000-0000-0000-000000000001",
  building: "Main Building",
  floor: 1,
  laptop_count: 5,
  is_active: true,
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

export const BOOKING_1 = {
  id: "20000000-0000-0000-0000-000000000001",
  teacher_id: "00000000-0000-0000-0000-000000000002",
  laptop_group_id: LAPTOP_GROUP_1.id,
  teacher: {
    id: "00000000-0000-0000-0000-000000000002",
    first_name: "Test",
    last_name: "Teacher",
    email: "teacher@test.com",
  },
  laptop_group: {
    id: LAPTOP_GROUP_1.id,
    building: LAPTOP_GROUP_1.building,
    floor: LAPTOP_GROUP_1.floor,
    laptop_count: LAPTOP_GROUP_1.laptop_count,
  },
  booking_date: "2026-04-07",
  start_time: "09:00:00",
  end_time: "10:00:00",
  notes: null,
  created_at: "2026-04-05T08:00:00Z",
  updated_at: "2026-04-05T08:00:00Z",
};

export const ADMIN_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "admin@test.com",
  first_name: "Admin",
  last_name: "User",
  role: "admin",
  password_is_temporary: false,
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
};

export const TEACHER_USER = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "teacher@test.com",
  first_name: "Test",
  last_name: "Teacher",
  role: "teacher",
  password_is_temporary: true,
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
};

/** Default happy-path handlers — tests can override individual handlers with server.use(...). */
export const handlers = [
  http.post("http://localhost/api/auth/login", () =>
    HttpResponse.json({
      access_token: "test-token",
      token_type: "bearer",
      id: ADMIN_USER.id,
      email: ADMIN_USER.email,
      first_name: ADMIN_USER.first_name,
      last_name: ADMIN_USER.last_name,
      password_is_temporary: false,
      role: "admin",
    })
  ),

  http.get("http://localhost/api/auth/me", () => HttpResponse.json(ADMIN_USER)),

  http.post("http://localhost/api/auth/change-password", () =>
    HttpResponse.json({ message: "Password updated successfully" })
  ),

  http.get("http://localhost/api/admin/teachers", () =>
    HttpResponse.json([TEACHER_USER])
  ),

  http.post("http://localhost/api/admin/teachers", () =>
    HttpResponse.json(TEACHER_USER, { status: 201 })
  ),

  http.delete("http://localhost/api/admin/teachers/:id", () =>
    HttpResponse.json({ message: "Teacher deleted" })
  ),

  // Laptop groups
  http.get("http://localhost/api/laptop-groups", () =>
    HttpResponse.json([LAPTOP_GROUP_1])
  ),
  http.post("http://localhost/api/laptop-groups", () =>
    HttpResponse.json(LAPTOP_GROUP_1, { status: 201 })
  ),
  http.patch("http://localhost/api/laptop-groups/:id", () =>
    HttpResponse.json(LAPTOP_GROUP_1)
  ),
  http.delete("http://localhost/api/laptop-groups/:id", () =>
    HttpResponse.json({ message: "Laptop group deactivated" })
  ),

  // Bookings
  http.get("http://localhost/api/bookings", () =>
    HttpResponse.json([BOOKING_1])
  ),
  http.post("http://localhost/api/bookings", () =>
    HttpResponse.json(BOOKING_1, { status: 201 })
  ),
  http.patch("http://localhost/api/bookings/:id", () =>
    HttpResponse.json(BOOKING_1)
  ),
  http.delete("http://localhost/api/bookings/:id", () =>
    HttpResponse.json({ message: "Booking deleted" })
  ),
];
