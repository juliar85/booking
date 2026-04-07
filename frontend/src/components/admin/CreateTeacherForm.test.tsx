import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import CreateTeacherForm from "./CreateTeacherForm";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { TEACHER_USER } from "../../test/handlers";

function renderForm(onCreated = vi.fn()) {
  return renderWithProviders(<CreateTeacherForm onCreated={onCreated} />);
}

describe("CreateTeacherForm", () => {
  it("renders all input fields and Add button", () => {
    renderForm();
    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/temporary password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
  });

  it("submits correct payload to POST /admin/teachers", async () => {
    let capturedBody: unknown;
    server.use(
      http.post("http://localhost/api/admin/teachers", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(TEACHER_USER, { status: 201 });
      })
    );

    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Jane");
    await userEvent.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "jane@test.com");
    await userEvent.type(screen.getByPlaceholderText(/temporary password/i), "temppass123");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await screen.findByRole("button", { name: /^add$/i }); // wait for loading to finish
    expect(capturedBody).toMatchObject({
      email: "jane@test.com",
      first_name: "Jane",
      last_name: "Doe",
      temporary_password: "temppass123",
    });
  });

  it("clears form fields and calls onCreated after success", async () => {
    const onCreated = vi.fn();
    renderForm(onCreated);

    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Jane");
    await userEvent.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "jane@test.com");
    await userEvent.type(screen.getByPlaceholderText(/temporary password/i), "temppass123");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await screen.findByRole("button", { name: /^add$/i });
    expect(onCreated).toHaveBeenCalledOnce();
    expect((screen.getByPlaceholderText(/first name/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByPlaceholderText(/email/i) as HTMLInputElement).value).toBe("");
  });

  it("shows API error detail on failure", async () => {
    server.use(
      http.post("http://localhost/api/admin/teachers", () =>
        HttpResponse.json({ detail: "Email already exists" }, { status: 400 })
      )
    );

    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Jane");
    await userEvent.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "dup@test.com");
    await userEvent.type(screen.getByPlaceholderText(/temporary password/i), "temppass123");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
  });

  it("shows fallback error message when API returns no detail", async () => {
    server.use(
      http.post("http://localhost/api/admin/teachers", () =>
        HttpResponse.json({}, { status: 500 })
      )
    );

    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Jane");
    await userEvent.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "x@test.com");
    await userEvent.type(screen.getByPlaceholderText(/temporary password/i), "temppass123");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(await screen.findByText(/failed to create teacher/i)).toBeInTheDocument();
  });

  it("disables Add button while loading", async () => {
    let resolveRequest!: () => void;
    server.use(
      http.post("http://localhost/api/admin/teachers", () =>
        new Promise<Response>((resolve) => {
          resolveRequest = () =>
            resolve(HttpResponse.json(TEACHER_USER, { status: 201 }));
        })
      )
    );

    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Jane");
    await userEvent.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "x@test.com");
    await userEvent.type(screen.getByPlaceholderText(/temporary password/i), "temppass123");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(screen.getByRole("button", { name: /adding/i })).toBeDisabled();
    resolveRequest();
  });
});
