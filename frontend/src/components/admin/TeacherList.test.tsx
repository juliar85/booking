import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi, afterEach } from "vitest";
import TeacherList from "./TeacherList";
import { server } from "../../test/mswServer";
import { TEACHER_USER } from "../../test/handlers";

// TeacherList has no React context dependencies — plain RTL render is sufficient.
function renderList(refreshTrigger = 0) {
  return render(<TeacherList refreshTrigger={refreshTrigger} />);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TeacherList", () => {
  it("shows loading indicator before data arrives", () => {
    renderList();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders teacher rows after fetch", async () => {
    renderList();
    expect(await screen.findByText(TEACHER_USER.email)).toBeInTheDocument();
    expect(
      screen.getByText(`${TEACHER_USER.first_name} ${TEACHER_USER.last_name}`)
    ).toBeInTheDocument();
  });

  it("shows 'No teachers yet' when list is empty", async () => {
    server.use(
      http.get("http://localhost/api/admin/teachers", () => HttpResponse.json([]))
    );
    renderList();
    expect(await screen.findByText(/no teachers yet/i)).toBeInTheDocument();
  });

  it("shows Temporary badge when password_is_temporary is true", async () => {
    renderList();
    expect(await screen.findByText(/temporary/i)).toBeInTheDocument();
  });

  it("shows 'Set' when password is not temporary", async () => {
    server.use(
      http.get("http://localhost/api/admin/teachers", () =>
        HttpResponse.json([{ ...TEACHER_USER, password_is_temporary: false }])
      )
    );
    renderList();
    expect(await screen.findByText("Set")).toBeInTheDocument();
    expect(screen.queryByText(/temporary/i)).not.toBeInTheDocument();
  });

  it("calls DELETE and refetches after confirmed delete", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    let deleteCallCount = 0;
    let getCallCount = 0;
    server.use(
      http.delete("http://localhost/api/admin/teachers/:id", () => {
        deleteCallCount++;
        return HttpResponse.json({ message: "Teacher deleted" });
      }),
      http.get("http://localhost/api/admin/teachers", () => {
        getCallCount++;
        return HttpResponse.json(getCallCount > 1 ? [] : [TEACHER_USER]);
      })
    );

    renderList();
    await userEvent.click(await screen.findByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(deleteCallCount).toBe(1);
      expect(getCallCount).toBeGreaterThan(1);
    });
  });

  it("does not call DELETE when user cancels", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    let deleteCallCount = 0;
    server.use(
      http.delete("http://localhost/api/admin/teachers/:id", () => {
        deleteCallCount++;
        return HttpResponse.json({ message: "Teacher deleted" });
      })
    );

    renderList();
    await userEvent.click(await screen.findByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(deleteCallCount).toBe(0);
    });
  });

  it("re-fetches when refreshTrigger changes", async () => {
    let getCallCount = 0;
    server.use(
      http.get("http://localhost/api/admin/teachers", () => {
        getCallCount++;
        return HttpResponse.json([TEACHER_USER]);
      })
    );

    const { rerender } = renderList(0);
    await screen.findByText(TEACHER_USER.email);
    const callsAfterMount = getCallCount;

    rerender(<TeacherList refreshTrigger={1} />);

    await waitFor(() => {
      expect(getCallCount).toBeGreaterThan(callsAfterMount);
    });
  });
});
