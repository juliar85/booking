import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GroupSelector from "./GroupSelector";
import { LAPTOP_GROUP_1 } from "../../test/handlers";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mswServer";

describe("GroupSelector", () => {
  it("renders building select after load", async () => {
    render(<GroupSelector selectedGroupId={null} onGroupSelect={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /building/i })).toBeTruthy();
    });
  });

  it("shows the building from loaded groups", async () => {
    render(<GroupSelector selectedGroupId={null} onGroupSelect={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(LAPTOP_GROUP_1.building)).toBeTruthy();
    });
  });

  it("shows the floor select after a specific building is selected", async () => {
    const user = userEvent.setup();
    render(<GroupSelector selectedGroupId={null} onGroupSelect={vi.fn()} />);
    await waitFor(() => screen.getByRole("combobox", { name: /building/i }));
    await user.selectOptions(screen.getByRole("combobox", { name: /building/i }), LAPTOP_GROUP_1.building);
    expect(screen.getByRole("combobox", { name: /floor/i })).toBeTruthy();
  });

  it("calls onGroupSelect with null (all) on mount by default", async () => {
    const onGroupSelect = vi.fn();
    render(<GroupSelector selectedGroupId={null} onGroupSelect={onGroupSelect} />);
    await waitFor(() => {
      expect(onGroupSelect).toHaveBeenCalledWith(null);
    });
  });

  it("shows error message when API fails", async () => {
    server.use(
      http.get("http://localhost/api/laptop-groups", () =>
        HttpResponse.json({ detail: "error" }, { status: 500 })
      )
    );
    render(<GroupSelector selectedGroupId={null} onGroupSelect={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeTruthy();
    });
  });

  it("shows 'No laptop groups available' when list is empty", async () => {
    server.use(
      http.get("http://localhost/api/laptop-groups", () => HttpResponse.json([]))
    );
    render(<GroupSelector selectedGroupId={null} onGroupSelect={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/No laptop groups/i)).toBeTruthy();
    });
  });
});
