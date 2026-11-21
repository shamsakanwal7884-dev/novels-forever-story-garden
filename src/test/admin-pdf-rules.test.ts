import { describe, expect, it } from "vitest";

import { MAX_PDF_BYTES } from "@/lib/admin";

describe("owner PDF upload limit", () => {
  it("keeps uploads at or below 50 MB", () => {
    expect(MAX_PDF_BYTES).toBe(50 * 1024 * 1024);
  });
});