import { describe, expect, it } from "vitest";
import { validatePin } from "@/lib/auth/pin-policy";

describe("PIN length", () => {
  it("asks a member for 6 digits and an official for 8", () => {
    expect(validatePin("482916", "MEMBER")).toBeNull();
    expect(validatePin("2580", "MEMBER")).toBe("Use a 6-digit PIN.");
    expect(validatePin("48291637", "TREASURER")).toBeNull();
    expect(validatePin("482916", "TREASURER")).toBe("Use an 8-digit PIN.");
    expect(validatePin("111111", "MEMBER")).toBe("Choose a PIN that is not easy to guess.");
    expect(validatePin("12345678", "CHAIR")).toBe("Choose a PIN that is not easy to guess.");
  });
});
