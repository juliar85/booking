import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/mswServer";
import client from "./client";

describe("api/client", () => {
  it("attaches Bearer token from localStorage to requests", async () => {
    localStorage.setItem("token", "my-test-token");

    let capturedAuthHeader: string | null = null;
    server.use(
      http.get("http://localhost/api/auth/me", ({ request }) => {
        capturedAuthHeader = request.headers.get("Authorization");
        return HttpResponse.json({ id: "1" });
      })
    );

    await client.get("/auth/me");
    expect(capturedAuthHeader).toBe("Bearer my-test-token");
  });

  it("does not attach Authorization header when no token in localStorage", async () => {
    // localStorage is cleared by afterEach in setup.ts
    let capturedAuthHeader: string | null = "should-be-overwritten";
    server.use(
      http.get("http://localhost/api/auth/me", ({ request }) => {
        capturedAuthHeader = request.headers.get("Authorization");
        return HttpResponse.json({ id: "1" });
      })
    );

    await client.get("/auth/me");
    expect(capturedAuthHeader).toBeNull();
  });
});
