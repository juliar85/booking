import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import DashboardPage from "./DashboardPage";
import { server } from "../test/mswServer";
import { renderWithProviders, renderWithRoutes } from "../test/renderWithProviders";
import { ADMIN_USER, TEACHER_USER } from "../test/handlers";

async function renderDashboard(meResponse: object) {
  localStorage.setItem("token", "test-token");
  server.use(
    http.get("http://localhost/api/auth/me", () => HttpResponse.json(meResponse))
  );

  renderWithProviders(<DashboardPage />, { initialEntries: ["/dashboard"] });

  // Wait for the auth to resolve and the page to render
  await screen.findByRole("button", { name: /log out/i });
}

describe("DashboardPage", () => {
  it("admin sees Teacher accounts section", async () => {
    server.use(
      http.get("http://localhost/api/admin/teachers", () => HttpResponse.json([]))
    );
    await renderDashboard(ADMIN_USER);
    expect(screen.getByText(/teacher accounts/i)).toBeInTheDocument();
  });

  it("teacher sees BookingCalendar, not teacher management", async () => {
    await renderDashboard(TEACHER_USER);
    // The BookingCalendar renders a GroupSelector with a building dropdown
    expect(await screen.findByRole("combobox", { name: /building/i })).toBeInTheDocument();
    expect(screen.queryByText(/teacher accounts/i)).not.toBeInTheDocument();
  });

  it("displays the user's full name in the header", async () => {
    server.use(
      http.get("http://localhost/api/admin/teachers", () => HttpResponse.json([]))
    );
    await renderDashboard(ADMIN_USER);
    expect(await screen.findByText("Admin User")).toBeInTheDocument();
  });

  it("logout clears auth and navigates to /login", async () => {
    localStorage.setItem("token", "test-token");
    server.use(
      http.get("http://localhost/api/auth/me", () => HttpResponse.json(ADMIN_USER)),
      http.get("http://localhost/api/admin/teachers", () => HttpResponse.json([]))
    );
    // Use full routing so navigate("/login") renders LoginPage
    renderWithRoutes("/dashboard");
    await screen.findByRole("button", { name: /log out/i });

    await userEvent.click(screen.getByRole("button", { name: /log out/i }));

    // After logout, login page should appear
    expect(await screen.findByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("Change password button navigates to /change-password", async () => {
    server.use(
      http.get("http://localhost/api/admin/teachers", () => HttpResponse.json([]))
    );
    await renderDashboard(ADMIN_USER);
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    // ChangePasswordPage should render
    expect(
      await screen.findByText(/change password/i)
    ).toBeInTheDocument();
  });
});
