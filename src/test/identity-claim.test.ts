import { describe, expect, it } from "vitest";

import { isVerifiedEmailMatch, safeAuthReturnPath } from "@/lib/auth.functions";

describe("original account email matching", () => {
  it("requires a verified session and a matching exported email", () => {
    expect(
      isVerifiedEmailMatch("Owner@Example.test", "2026-01-01T00:00:00.000Z", "owner@example.test"),
    ).toBe(true);
    expect(isVerifiedEmailMatch("owner@example.test", null, "owner@example.test")).toBe(false);
    expect(
      isVerifiedEmailMatch("other@example.test", "2026-01-01T00:00:00.000Z", "owner@example.test"),
    ).toBe(false);
  });
});

describe("owner sign-in return path", () => {
  const origin = "https://novels.example";

  it("keeps a same-origin page, query, and anchor", () => {
    expect(safeAuthReturnPath("/authors?sort=latest#writers", origin)).toBe("/authors?sort=latest#writers");
  });

  it("rejects external and protocol-relative destinations", () => {
    expect(safeAuthReturnPath("https://outside.example/admin", origin)).toBe("/admin");
    expect(safeAuthReturnPath("//outside.example/admin", origin)).toBe("/admin");
  });

  it("prevents returning to the sign-in page while allowing author routes", () => {
    expect(safeAuthReturnPath("/auth", origin)).toBe("/admin");
    expect(safeAuthReturnPath("/authors", origin)).toBe("/authors");
  });
});