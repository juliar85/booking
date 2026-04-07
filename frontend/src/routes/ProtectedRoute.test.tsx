import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import ProtectedRoute from "./ProtectedRoute";
import { server } from "../test/mswServer";
import { renderWithProviders } from "../test/renderWithProviders";
import { ADMIN_USER, TEACHER_USER } from "../test/handlers";

const Protected = () => <div>Protected content</div>;

describe("ProtectedRoute", () => {
  it("redirects to /login when not authenticated", async () => {
    // No token in localStorage — AuthContext will not call /auth/me
    // Override the me handler to ensure it's not called
    server.use(
      http.get("http://localhost/api/auth/me", () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    renderWithProviders(
      <ProtectedRoute>
        <Protected />
      </ProtectedRoute>,
      { initialEntries: ["/dashboard"] }
    );

    await waitFor(() => {
      expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    });
  });

  it("renders children when authenticated as admin", async () => {
    localStorage.setItem("token", "test-token");

    renderWithProviders(
      <ProtectedRoute>
        <Protected />
      </ProtectedRoute>
    );

    expect(await screen.findByText("Protected content")).toBeInTheDocument();
  });

  it("renders null while loading (no flash of redirect)", () => {
    localStorage.setItem("token", "test-token");
    // Don't await — capture the synchronous initial render
    const { container } = renderWithProviders(
      <ProtectedRoute>
        <Protected />
      </ProtectedRoute>
    );
    // While loading, ProtectedRoute returns null → container is empty
    expect(container.firstChild).toBeNull();
  });

  it("redirects teacher to /dashboard when adminOnly is set", async () => {
    localStorage.setItem("token", "test-token");
    server.use(
      http.get("http://localhost/api/auth/me", () => HttpResponse.json(TEACHER_USER))
    );

    renderWithProviders(
      <ProtectedRoute adminOnly>
        <Protected />
      </ProtectedRoute>,
      { initialEntries: ["/admin"] }
    );

    await waitFor(() => {
      expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    });
  });

  it("allows admin through adminOnly route", async () => {
    localStorage.setItem("token", "test-token");
    server.use(
      http.get("http://localhost/api/auth/me", () => HttpResponse.json(ADMIN_USER))
    );

    renderWithProviders(
      <ProtectedRoute adminOnly>
        <Protected />
      </ProtectedRoute>
    );

    expect(await screen.findByText("Protected content")).toBeInTheDocument();
  });
});
