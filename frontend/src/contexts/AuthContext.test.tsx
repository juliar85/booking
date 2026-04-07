import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { server } from "../test/mswServer";
import { ADMIN_USER, TEACHER_USER } from "../test/handlers";

/** Helper: renders a component that exposes auth state via data-testid attributes. */
function AuthInspector() {
  const { user, loading, login, logout, setPasswordChanged } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : "null"}</span>
      <button onClick={() => login("tok", { id: "1", email: "u@e.com", firstName: "A", lastName: "B", role: "teacher", passwordIsTemporary: true })}>
        login
      </button>
      <button onClick={logout}>logout</button>
      <button onClick={setPasswordChanged}>setPasswordChanged</button>
    </div>
  );
}

function renderAuth() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <AuthInspector />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AuthContext", () => {
  it("starts with loading=true and user=null", async () => {
    // Set a token so AuthContext fires the /auth/me request (async).
    // While the request is in-flight, loading stays true.
    localStorage.setItem("token", "test-token");
    let resolveMe: (() => void) | undefined;
    server.use(
      http.get("http://localhost/api/auth/me", () =>
        new Promise<Response>((resolve) => {
          resolveMe = () => resolve(HttpResponse.json({}, { status: 401 }));
        })
      )
    );
    renderAuth();
    // Request is in-flight → loading is true
    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("null");
    // Wait for the MSW handler to be invoked (it fires asynchronously)
    await waitFor(() => expect(resolveMe).toBeDefined());
    // Resolve the request so the test cleans up without leaking async work
    resolveMe!();
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
  });

  it("sets loading=false and user=null when no token", async () => {
    renderAuth();
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("rehydrates user from /auth/me when token exists", async () => {
    localStorage.setItem("token", "test-token");
    server.use(
      http.get("http://localhost/api/auth/me", () => HttpResponse.json(ADMIN_USER))
    );
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    const user = JSON.parse(screen.getByTestId("user").textContent!);
    expect(user.email).toBe(ADMIN_USER.email);
    expect(user.role).toBe("admin");
  });

  it("clears token from localStorage when /auth/me returns 401", async () => {
    localStorage.setItem("token", "bad-token");
    server.use(
      http.get("http://localhost/api/auth/me", () =>
        HttpResponse.json({}, { status: 401 })
      )
    );
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("login() stores token in localStorage and sets user", async () => {
    renderAuth();
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );

    await userEvent.click(screen.getByText("login"));
    expect(localStorage.getItem("token")).toBe("tok");
    const user = JSON.parse(screen.getByTestId("user").textContent!);
    expect(user.email).toBe("u@e.com");
  });

  it("logout() removes token and sets user to null", async () => {
    localStorage.setItem("token", "test-token");
    server.use(
      http.get("http://localhost/api/auth/me", () => HttpResponse.json(ADMIN_USER))
    );
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).not.toBe("null")
    );

    await userEvent.click(screen.getByText("logout"));
    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("setPasswordChanged() sets passwordIsTemporary to false", async () => {
    localStorage.setItem("token", "test-token");
    server.use(
      http.get("http://localhost/api/auth/me", () => HttpResponse.json(TEACHER_USER))
    );
    renderAuth();

    await waitFor(() => {
      const user = JSON.parse(screen.getByTestId("user").textContent!);
      expect(user.passwordIsTemporary).toBe(true);
    });

    await userEvent.click(screen.getByText("setPasswordChanged"));
    const user = JSON.parse(screen.getByTestId("user").textContent!);
    expect(user.passwordIsTemporary).toBe(false);
  });

  it("useAuth() throws when used outside AuthProvider", () => {
    const BareConsumer = () => {
      useAuth();
      return null;
    };
    expect(() => render(<BareConsumer />)).toThrow(
      "useAuth must be used inside AuthProvider"
    );
  });
});
