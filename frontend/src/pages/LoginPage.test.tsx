import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import LoginPage from "./LoginPage";
import { server } from "../test/mswServer";
import { renderWithProviders, renderWithRoutes } from "../test/renderWithProviders";

function renderLogin() {
  return renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
}

describe("LoginPage", () => {
  it("renders email field, password field and Sign in button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("submits email and password to POST /auth/login", async () => {
    let capturedBody: unknown;
    server.use(
      http.post("http://localhost/api/auth/login", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          access_token: "tok",
          token_type: "bearer",
          id: "1",
          email: "admin@test.com",
          first_name: "Admin",
          last_name: "User",
          password_is_temporary: false,
          role: "admin",
        });
      })
    );

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "adminpassword");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        email: "admin@test.com",
        password: "adminpassword",
      });
    });
  });

  it("navigates to /dashboard when password is not temporary", async () => {
    server.use(
      http.post("http://localhost/api/auth/login", () =>
        HttpResponse.json({
          access_token: "tok",
          token_type: "bearer",
          id: "1",
          email: "admin@test.com",
          first_name: "Admin",
          last_name: "User",
          password_is_temporary: false,
          role: "admin",
        })
      ),
      http.get("http://localhost/api/auth/me", () =>
        HttpResponse.json({
          id: "1",
          email: "admin@test.com",
          first_name: "Admin",
          last_name: "User",
          role: "admin",
          password_is_temporary: false,
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        })
      ),
      http.get("http://localhost/api/admin/teachers", () => HttpResponse.json([]))
    );

    // Use full routing so navigate("/dashboard") renders DashboardPage
    renderWithRoutes("/login");
    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Dashboard shows "Log out" button
    expect(await screen.findByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("navigates to /change-password when password is temporary", async () => {
    server.use(
      http.post("http://localhost/api/auth/login", () =>
        HttpResponse.json({
          access_token: "tok",
          token_type: "bearer",
          id: "2",
          email: "teacher@test.com",
          first_name: "Test",
          last_name: "Teacher",
          password_is_temporary: true,
          role: "teacher",
        })
      ),
      http.get("http://localhost/api/auth/me", () =>
        HttpResponse.json({
          id: "2",
          email: "teacher@test.com",
          first_name: "Test",
          last_name: "Teacher",
          role: "teacher",
          password_is_temporary: true,
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        })
      )
    );

    // Use full routing so navigate("/change-password") renders ChangePasswordPage
    renderWithRoutes("/login");
    await userEvent.type(screen.getByLabelText(/email/i), "teacher@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // ChangePasswordPage shows "Set your permanent password"
    expect(
      await screen.findByText(/set your permanent password/i)
    ).toBeInTheDocument();
  });

  it("shows error message on failed login", async () => {
    server.use(
      http.post("http://localhost/api/auth/login", () =>
        HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 })
      )
    );

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "bad@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
  });

  it("disables button while request is in flight", async () => {
    let resolveRequest!: () => void;
    server.use(
      http.post("http://localhost/api/auth/login", () =>
        new Promise<Response>((resolve) => {
          resolveRequest = () =>
            resolve(
              HttpResponse.json({
                access_token: "tok",
                token_type: "bearer",
                id: "1",
                email: "admin@test.com",
                first_name: "Admin",
                last_name: "User",
                password_is_temporary: false,
                role: "admin",
              })
            );
        })
      )
    );

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    resolveRequest();
  });
});
