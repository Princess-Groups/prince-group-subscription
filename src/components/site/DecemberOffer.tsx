import { Link } from "@tanstack/react-router";
import { CalendarDays, Gift, Snowflake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { shortDate } from "@/lib/format";

export type OfferRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount: number | null;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  applicable_plan: string | null;
};

const SNOWFLAKES = [
  "left-[54%] top-[18%] size-5 opacity-70",
  "right-[16%] top-[26%] size-6 opacity-60",
  "right-[38%] top-[44%] size-4 opacity-50",
  "left-[46%] bottom-[22%] size-4 opacity-40",
];

/** Christmas gift box, ornaments and ribbon — drawn with SVG so the text stays editable. */
function ChristmasScene() {
  return (
    <div aria-hidden className="xmas-scene pointer-events-none">
      <svg viewBox="0 0 320 300" className="h-full w-full" role="presentation">
        <defs>
          <linearGradient id="xmasGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.94 0.11 96)" />
            <stop offset="45%" stopColor="oklch(0.82 0.15 90)" />
            <stop offset="100%" stopColor="oklch(0.62 0.12 78)" />
          </linearGradient>
          <linearGradient id="xmasBox" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.15 138)" />
            <stop offset="100%" stopColor="oklch(0.3 0.08 142)" />
          </linearGradient>
          <linearGradient id="xmasLid" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.17 136)" />
            <stop offset="100%" stopColor="oklch(0.4 0.1 140)" />
          </linearGradient>
          <radialGradient id="xmasBall" cx="0.35" cy="0.3">
            <stop offset="0%" stopColor="oklch(0.96 0.09 98)" />
            <stop offset="60%" stopColor="oklch(0.8 0.15 92)" />
            <stop offset="100%" stopColor="oklch(0.55 0.11 80)" />
          </radialGradient>
          <filter id="xmasGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* halo */}
        <ellipse cx="160" cy="240" rx="120" ry="26" fill="oklch(0.75 0.2 125 / 0.18)" filter="url(#xmasGlow)" />

        {/* pine sprigs */}
        {[
          "M30 236 q40 -22 84 -6",
          "M290 236 q-42 -24 -88 -8",
          "M44 248 q46 -10 74 4",
        ].map((d) => (
          <path key={d} d={d} stroke="oklch(0.5 0.12 143)" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.75" />
        ))}

        {/* ribbon tail */}
        <path
          d="M214 246 q34 -16 48 8 q-26 20 -48 10"
          fill="none"
          stroke="url(#xmasGold)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* gift box */}
        <rect x="96" y="140" width="128" height="100" rx="10" fill="url(#xmasBox)" />
        <rect x="88" y="120" width="144" height="30" rx="9" fill="url(#xmasLid)" />
        <rect x="150" y="120" width="20" height="120" fill="url(#xmasGold)" opacity="0.95" />
        {/* bow */}
        <path d="M160 120 q-40 -12 -34 -38 q28 -8 34 38Z" fill="url(#xmasGold)" />
        <path d="M160 120 q40 -12 34 -38 q-28 -8 -34 38Z" fill="url(#xmasGold)" />
        <circle cx="160" cy="116" r="11" fill="url(#xmasGold)" />

        {/* ornaments */}
        <g className="xmas-bauble">
          <rect x="248" y="150" width="4" height="16" fill="url(#xmasGold)" />
          <circle cx="250" cy="192" r="26" fill="url(#xmasBall)" />
        </g>
        <g className="xmas-bauble xmas-bauble-slow">
          <rect x="70" y="182" width="3" height="12" fill="url(#xmasGold)" />
          <circle cx="71" cy="212" r="17" fill="url(#xmasBall)" />
        </g>
        <circle cx="222" cy="232" r="12" fill="url(#xmasBall)" opacity="0.9" />

        {/* pine cones */}
        <ellipse cx="108" cy="236" rx="11" ry="15" fill="oklch(0.58 0.09 72)" />
        <ellipse cx="128" cy="244" rx="8" ry="11" fill="oklch(0.52 0.08 70)" />
      </svg>
    </div>
  );
}

/** Premium, visually dominant December campaign banner driven by backend offer data. */
export function DecemberOffer({ offer }: { offer: OfferRow }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="xmas-banner reveal relative isolate overflow-hidden rounded-[2.25rem] p-6 text-cream shadow-lift sm:p-10 lg:p-14">
        <div className="xmas-glow pointer-events-none absolute inset-0 -z-10" />

        {SNOWFLAKES.map((pos, i) => (
          <Snowflake
            key={pos}
            aria-hidden
            className={`xmas-snow pointer-events-none absolute hidden text-cream md:block ${pos}`}
            style={{ animationDelay: `${i * 1.4}s` }}
          />
        ))}

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.86_0.13_95/0.5)] bg-[oklch(0.86_0.13_95/0.1)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[oklch(0.93_0.11_98)]">
              <Gift className="size-3.5" /> Seasonal Campaign
            </span>

            <h2 className="xmas-title mt-5 font-display text-[clamp(2.4rem,7vw,4.6rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
              <span className="xmas-title-main">December</span>{" "}
              <span className="xmas-title-accent">Offer</span>
            </h2>

            <p className="mt-4 max-w-xl text-lg font-extrabold text-accent drop-shadow-[0_0_18px_oklch(0.75_0.2_125/0.45)] sm:text-xl">
              {offer.title}
            </p>
            {offer.description ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/90 sm:text-base">
                {offer.description}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-semibold sm:text-sm">
              {offer.start_date || offer.end_date ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-[oklch(0.3_0.07_142/0.35)] px-4 py-2 text-cream/95">
                  <CalendarDays className="size-4 text-accent" />
                  {offer.start_date ? shortDate(offer.start_date) : "Now"}
                  {offer.end_date ? ` – ${shortDate(offer.end_date)}` : ""}
                </span>
              ) : null}
              {offer.applicable_plan ? (
                <span className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 capitalize text-accent">
                  {offer.applicable_plan} plan
                </span>
              ) : null}
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${
                  offer.active
                    ? "bg-gradient-lime font-bold text-primary"
                    : "border border-cream/25 text-cream/90"
                }`}
              >
                {offer.active ? (
                  <>
                    <span className="xmas-dot size-2 rounded-full bg-primary" /> Live now
                  </>
                ) : (
                  "Scheduled"
                )}
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="lime" className="w-full rounded-full sm:w-auto">
                <Link
                  to="/payment"
                  search={offer.applicable_plan ? { plan: offer.applicable_plan } : {}}
                >
                  Claim December Offer →
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="onOlive"
                className="w-full rounded-full sm:w-auto"
              >
                <Link to="/contact">Ask About This Offer</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <ChristmasScene />
            <div className="xmas-card relative z-10 overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
              <Snowflake aria-hidden className="absolute left-5 top-8 size-6 text-cream/45" />
              <Snowflake aria-hidden className="absolute right-6 top-6 size-7 text-cream/35" />
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cream/90">
                Save up to
              </p>
              <p className="xmas-percent mt-3 font-display text-[clamp(3.6rem,11vw,6rem)] font-extrabold leading-none">
                {offer.discount ?? 0}%
              </p>
              <p className="mt-3 text-sm leading-relaxed text-cream/90">
                Applied automatically at checkout during the campaign window.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-lime opacity-40" />
                <Gift className="size-4 text-accent" />
                <span className="h-px flex-1 bg-gradient-lime opacity-40" />
              </div>
              <p className="mt-5 text-xs leading-relaxed text-cream/85">
                Discount value, dates and eligible plan are configured by administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
