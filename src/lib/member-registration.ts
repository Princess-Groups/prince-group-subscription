import { z } from "zod";

/** Usernames are login handles; auth needs an email, so we derive a fixed private address. */
export const USERNAME_EMAIL_DOMAIN = "members.princegroup.app";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function loginEmail(identifier: string): string {
  const value = identifier.trim();
  if (value.includes("@")) return value.toLowerCase();
  return `${normalizeUsername(value)}@${USERNAME_EMAIL_DOMAIN}`;
}

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  phone: z.string().trim().regex(/^[0-9+\s-]{10,15}$/, "Please enter a valid contact number."),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{3,30}$/, "Username: 3–30 letters, numbers, dot, dash or underscore."),
  password: z.string().min(6, "Password must be at least 6 characters.").max(72),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email("Please enter a valid email address.").max(255).optional().or(z.literal("")),
});

export type Registration = z.infer<typeof registrationSchema>;
