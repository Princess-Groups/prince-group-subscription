function normalizedPhone(phone: string | null | undefined) {
  return (phone ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

export function retainPhoneVerification(input: {
  phone: string; previousPhone: string | null; previousVerified: boolean;
  confirmedPhone?: string; confirmedAt?: string;
}) {
  const phone = normalizedPhone(input.phone);
  if (phone.length !== 10) return false;
  return Boolean(
    (input.confirmedAt && normalizedPhone(input.confirmedPhone) === phone) ||
    (input.previousVerified && normalizedPhone(input.previousPhone) === phone),
  );
}