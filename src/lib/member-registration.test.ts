import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loginEmail, registrationSchema } from "./member-registration";

const base = { name: "Sanjai", phone: "8015501005", username: "sanjai_k", password: "secret1" };

describe("member registration", () => {
  it("accepts registration without location or email", () => {
    assert.equal(registrationSchema.safeParse(base).success, true);
  });
  it("requires a contact number", () => {
    assert.equal(registrationSchema.safeParse({ ...base, phone: "" }).success, false);
  });
  it("requires a username", () => {
    assert.equal(registrationSchema.safeParse({ ...base, username: "" }).success, false);
  });
  it("maps a username to the same login regardless of case", () => {
    assert.equal(loginEmail(" Sanjai_K "), "sanjai_k@members.princegroup.app");
  });
  it("keeps an email identifier as-is", () => {
    assert.equal(loginEmail("a@b.com"), "a@b.com");
  });
});
