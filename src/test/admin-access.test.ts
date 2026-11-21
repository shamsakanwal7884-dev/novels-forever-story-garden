import { describe, expect, it } from "vitest";

import { isAdminRole } from "@/lib/admin";

describe("owner portal access", () => {
  it("allows only the admin role", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole("moderator")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });
});