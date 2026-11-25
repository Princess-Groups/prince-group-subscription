import { describe, expect, it } from "vitest";
import { loginEmail, registrationSchema } from "./member-registration";

const base = { name: "Sanjai", phone: "8015501005", username: "sanjai_k", password: "secret1" };

describe("member registration", () => {
  it("accepts registration without location or email", () => {
    expect(registrationSchema.safeParse(base).success).toBe(true);
  });
  it("requires a contact number", () => {
    expect(registrationSchema.safeParse({ ...base, phone: "" }).success).toBe(false);
  });
  it("requires a username", () => {
    expect(registrationSchema.safeParse({ ...base, username: "" }).success).toBe(false);
  });
  it("maps a username to the same login regardless of case", () => {
    expect(loginEmail(" Sanjai_K ")).toBe("sanjai_k@members.princegroup.app");
  });
  it("keeps an email identifier as-is", () => {
    expect(loginEmail("a@b.com")).toBe("a@b.com");
  });
});
