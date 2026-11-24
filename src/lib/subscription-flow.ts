export const SUBSCRIPTION_CODES = ["starter", "business", "premium"] as const;
export type SubscriptionCode = (typeof SUBSCRIPTION_CODES)[number];

export function subscriptionCode(value: unknown): SubscriptionCode | undefined {
  return SUBSCRIPTION_CODES.find((code) => code === value);
}

export function checkoutReturnPath(value: unknown): string {
  const code = subscriptionCode(value);
  return code ? `/payment?plan=${code}` : "/payment";
}

/** Authentication may return only to this app's checkout, never an external URL. */
export function authDestination(value: unknown) {
  if (typeof value === "string" && /^\/payment(?:\?|$)/.test(value)) {
    const url = new URL(value, "https://prince.invalid");
    const plan = subscriptionCode(url.searchParams.get("plan"));
    return plan
      ? { to: "/payment" as const, search: { plan } }
      : { to: "/payment" as const, search: {} };
  }
  return { to: "/dashboard" as const };
}

export const AUTH_RETURN_KEY = "prince-auth-checkout-return";