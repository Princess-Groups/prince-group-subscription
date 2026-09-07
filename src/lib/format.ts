export function inr(value: number | string | null | undefined, opts?: { decimals?: boolean }) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: opts?.decimals ? 2 : 0,
    maximumFractionDigits: opts?.decimals ? 2 : 0,
  }).format(n);
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function nextWeeklyReset() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = (8 - (day === 0 ? 7 : day)) % 7 || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(0, 0, 0, 0);
  const ms = next.getTime() - now.getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return `${days} Days ${hours} Hours`;
}

export function upcomingMonths(count = 3) {
  const out: { value: string; label: string }[] = [];
  const base = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    out.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    });
  }
  return out;
}

export function weeklyResetCountdown(now: Date = new Date()) {
  const next = new Date(now);
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  const hours = Math.max(Math.round((next.getTime() - now.getTime()) / 3600000), 0);
  const days = Math.floor(hours / 24);
  return days > 0 ? `Resets in ${days}d ${hours % 24}h` : `Resets in ${hours}h`;
}

export function upcomingPeriods(count = 3, from: Date = new Date()) {
  const out: { value: string; label: string }[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({
      value,
      label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    });
  }
  return out;
}

export function phoneDisplay(raw: string) {
  const d = raw.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : raw;
}
