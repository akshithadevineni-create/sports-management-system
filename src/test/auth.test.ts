import { beforeEach, describe, expect, it } from "vitest";
import { clearSession, getStoredUsers, signIn, signUp } from "@/lib/auth";

describe("auth helpers", () => {
  beforeEach(() => {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("authUsers");
  });

  it("signs up a phone user and persists them", () => {
    const result = signUp({
      name: "Phone Member",
      method: "phone",
      identifier: "+91 91234 56789",
      password: "secret1",
    });

    expect(result.ok).toBe(true);
    expect(getStoredUsers().some((user) => user.phone === "9123456789")).toBe(true);
    expect(localStorage.getItem("auth")).toBe("true");
  });

  it("signs in with an existing phone number", () => {
    const result = signIn({
      method: "phone",
      identifier: "9876543210",
      password: "123456",
    });

    expect(result.ok).toBe(true);
  });

  it("returns a specific error for invalid email format on sign in", () => {
    const result = signIn({
      method: "email",
      identifier: "invalid-email",
      password: "123456",
    });

    expect(result).toEqual({
      ok: false,
      message: "Please enter a valid email address",
    });
  });

  it("returns a specific error when the account does not exist", () => {
    const result = signIn({
      method: "phone",
      identifier: "9999999999",
      password: "123456",
    });

    expect(result).toEqual({
      ok: false,
      message: "No account found with this phone number",
    });
  });

  it("returns a specific error for wrong password", () => {
    const result = signIn({
      method: "email",
      identifier: "ananya@sports.com",
      password: "wrong-pass",
    });

    expect(result).toEqual({
      ok: false,
      message: "Incorrect password",
    });
  });

  it("clears the current session", () => {
    signIn({
      method: "email",
      identifier: "ananya@sports.com",
      password: "123456",
    });

    clearSession();

    expect(localStorage.getItem("auth")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
