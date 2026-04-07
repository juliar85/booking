import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import AppRoutes from "../AppRoutes";
import type { ReactElement } from "react";

interface Options extends RenderOptions {
  /** Initial URL entries for MemoryRouter. Defaults to ["/"]. */
  initialEntries?: string[];
}

/**
 * Renders `ui` wrapped with AuthProvider + MemoryRouter.
 *
 * Use `initialEntries` to start at a specific route:
 *   renderWithProviders(<ChangePasswordPage />, { initialEntries: ["/change-password"] })
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ["/"], ...options }: Options = {}
) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </AuthProvider>,
    options
  );
}

/**
 * Renders the full app routing (all pages + navigation) inside a MemoryRouter.
 * Use this for tests that verify cross-page navigation.
 *
 *   renderWithRoutes("/login")  — starts at the login page
 *   renderWithRoutes("/dashboard")  — starts at the dashboard (requires auth in localStorage)
 */
export function renderWithRoutes(initialPath: string = "/") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>
  );
}
