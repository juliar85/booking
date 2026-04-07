import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import ChangePasswordPage from "./ChangePasswordPage";
import { server } from "../test/mswServer";
import { renderWithProviders, renderWithRoutes } from "../test/renderWithProviders";
import { ADMIN_USER, TEACHER_USER } from "../test/handlers";

/** Render ChangePasswordPage with a given auth state pre-loaded via /auth/me. */
async function renderChangePwd(meResponse: object) {
  localStorage.setItem("token", "test-token");
  server.use(
    http.get("http://localhost/api/auth/me", () => HttpResponse.json(meResponse))
  );

  renderWithProviders(<ChangePasswordPage />, {
    initialEntries: ["/change-password"],
  });

  // Wait for AuthContext to finish loading so `user` is set before checking UI
  await screen.findByRole("button", { name: /save password/i });
}

/** Render via full app routing — use for tests that verify navigation away from the page. */
async function renderChangePwdWithRoutes(meResponse: object) {
  localStorage.setItem("token", "test-token");
  server.use(
    http.get("http://localhost/api/auth/me", () => HttpResponse.json(meResponse))
  );

  renderWithRoutes("/change-password");

  await screen.findByRole("button", { name: /save password/i });
}

describe("ChangePasswordPage", () => {
  it("shows 'Set your permanent password' when password is temporary", async () => {
    await renderChangePwd(TEACHER_USER);
    expect(
      screen.getByText(/set your permanent password/i)
    ).toBeInTheDocument();
  });

  it("shows 'Change password' when password is not temporary", async () => {
    await renderChangePwd(ADMIN_USER);
    expect(screen.getByText(/^change password$/i)).toBeInTheDocument();
  });

  it("shows info message only in forced mode", async () => {
    await renderChangePwd(TEACHER_USER);
    expect(
      screen.getByText(/your account was created with a temporary password/i)
    ).toBeInTheDocument();
  });

  it("no info message in optional mode", async () => {
    await renderChangePwd(ADMIN_USER);
    expect(
      screen.queryByText(/your account was created with a temporary password/i)
    ).not.toBeInTheDocument();
  });

  it("Cancel button absent in forced mode", async () => {
    await renderChangePwd(TEACHER_USER);
    expect(
      screen.queryByRole("button", { name: /cancel/i })
    ).not.toBeInTheDocument();
  });

  it("Cancel button present in optional mode", async () => {
    await renderChangePwd(ADMIN_USER);
    expect(
      screen.getByRole("button", { name: /cancel/i })
    ).toBeInTheDocument();
  });

  it("shows error when new passwords do not match (no API call)", async () => {
    let apiCalled = false;
    server.use(
      http.post("http://localhost/api/auth/change-password", () => {
        apiCalled = true;
        return HttpResponse.json({ message: "ok" });
      })
    );

    await renderChangePwd(TEACHER_USER);
    await userEvent.type(screen.getByLabelText(/current password/i), "current");
    await userEvent.type(screen.getByLabelText(/^new password$/i), "newpass1");
    await userEvent.type(screen.getByLabelText(/confirm/i), "differentpass");
    await userEvent.click(screen.getByRole("button", { name: /save password/i }));

    expect(
      screen.getByText(/new passwords do not match/i)
    ).toBeInTheDocument();
    expect(apiCalled).toBe(false);
  });

  it("navigates to /dashboard on successful password change", async () => {
    server.use(
      http.get("http://localhost/api/admin/teachers", () => HttpResponse.json([]))
    );
    // Use full routing so navigate("/dashboard") renders DashboardPage
    await renderChangePwdWithRoutes(ADMIN_USER);
    await userEvent.type(screen.getByLabelText(/current password/i), "current");
    await userEvent.type(screen.getByLabelText(/^new password$/i), "newpass1");
    await userEvent.type(screen.getByLabelText(/confirm/i), "newpass1");
    await userEvent.click(screen.getByRole("button", { name: /save password/i }));

    // Dashboard appears
    expect(
      await screen.findByRole("button", { name: /log out/i })
    ).toBeInTheDocument();
  });

  it("shows API error detail on failure", async () => {
    server.use(
      http.post("http://localhost/api/auth/change-password", () =>
        HttpResponse.json(
          { detail: "Current password is incorrect" },
          { status: 400 }
        )
      )
    );

    await renderChangePwd(ADMIN_USER);
    await userEvent.type(screen.getByLabelText(/current password/i), "wrong");
    await userEvent.type(screen.getByLabelText(/^new password$/i), "newpass1");
    await userEvent.type(screen.getByLabelText(/confirm/i), "newpass1");
    await userEvent.click(screen.getByRole("button", { name: /save password/i }));

    expect(
      await screen.findByText(/current password is incorrect/i)
    ).toBeInTheDocument();
  });

  it("disables button while saving", async () => {
    let resolveRequest!: () => void;
    server.use(
      http.post("http://localhost/api/auth/change-password", () =>
        new Promise<Response>((resolve) => {
          resolveRequest = () =>
            resolve(HttpResponse.json({ message: "ok" }));
        })
      )
    );

    await renderChangePwd(ADMIN_USER);
    await userEvent.type(screen.getByLabelText(/current password/i), "current");
    await userEvent.type(screen.getByLabelText(/^new password$/i), "newpass1");
    await userEvent.type(screen.getByLabelText(/confirm/i), "newpass1");
    await userEvent.click(screen.getByRole("button", { name: /save password/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    resolveRequest();
  });
});
