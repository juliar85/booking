import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mswServer";
import LaptopGroupsPage from "./LaptopGroupsPage";
import { LAPTOP_GROUP_1 } from "../../test/handlers";

describe("LaptopGroupsPage", () => {
  it("renders the page heading", () => {
    render(<LaptopGroupsPage />);
    expect(screen.getByText(/Manage Laptop Groups/i)).toBeTruthy();
  });

  it("shows laptop groups from API", async () => {
    render(<LaptopGroupsPage />);
    await waitFor(() => {
      expect(screen.getByText(LAPTOP_GROUP_1.building)).toBeTruthy();
    });
  });

  it("shows 'No laptop groups' when list is empty", async () => {
    server.use(
      http.get("http://localhost/api/laptop-groups", () => HttpResponse.json([]))
    );
    render(<LaptopGroupsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No laptop groups yet/i)).toBeTruthy();
    });
  });

  it("renders create form inputs", () => {
    render(<LaptopGroupsPage />);
    expect(screen.getByRole("textbox", { name: /building name/i })).toBeTruthy();
    expect(screen.getByRole("spinbutton", { name: /floor number/i })).toBeTruthy();
    expect(screen.getByRole("spinbutton", { name: /laptop count/i })).toBeTruthy();
  });

  it("submits create form and reloads list", async () => {
    const user = userEvent.setup();
    render(<LaptopGroupsPage />);

    await user.type(screen.getByRole("textbox", { name: /building name/i }), "New Building");
    await user.type(screen.getByRole("spinbutton", { name: /floor number/i }), "2");
    await user.type(screen.getByRole("spinbutton", { name: /laptop count/i }), "10");
    await user.click(screen.getByRole("button", { name: /add group/i }));

    await waitFor(() => {
      // After create, the list is refreshed (MSW returns the group again)
      expect(screen.getByText(LAPTOP_GROUP_1.building)).toBeTruthy();
    });
  });

  it("shows server error when create fails", async () => {
    server.use(
      http.post("http://localhost/api/laptop-groups", () =>
        HttpResponse.json({ detail: "already exists" }, { status: 409 })
      )
    );
    const user = userEvent.setup();
    render(<LaptopGroupsPage />);

    await user.type(screen.getByRole("textbox", { name: /building name/i }), "X");
    await user.type(screen.getByRole("spinbutton", { name: /floor number/i }), "1");
    await user.type(screen.getByRole("spinbutton", { name: /laptop count/i }), "5");
    await user.click(screen.getByRole("button", { name: /add group/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
  });

  it("shows Edit button for each group", async () => {
    render(<LaptopGroupsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: new RegExp(`Edit ${LAPTOP_GROUP_1.building}`, "i") })
      ).toBeTruthy();
    });
  });

  it("shows Deactivate button for active groups", async () => {
    render(<LaptopGroupsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: new RegExp(`Deactivate ${LAPTOP_GROUP_1.building}`, "i") })
      ).toBeTruthy();
    });
  });

  it("calls DELETE when Deactivate is clicked", async () => {
    const user = userEvent.setup();
    render(<LaptopGroupsPage />);
    await waitFor(() =>
      screen.getByRole("button", { name: new RegExp(`Deactivate ${LAPTOP_GROUP_1.building}`, "i") })
    );
    await user.click(
      screen.getByRole("button", { name: new RegExp(`Deactivate ${LAPTOP_GROUP_1.building}`, "i") })
    );
    // After deactivation, list reloads — no error shown
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
