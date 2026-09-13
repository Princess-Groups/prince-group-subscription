import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { PlanCard } from "@/components/site/PlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useAuth";
import { settingString, usePlans, useSettings, useSlots } from "@/hooks/usePlatform";

export function PlansSection({
  title = "Choose Your Subscription",
  subtitle = "Every price, discount, slot limit and lead rule below is configured by the administrator and enforced on the server.",
  filter,
  cinematicFocus = false,
}: {
  title?: string;
  subtitle?: string;
  filter?: (code: string) => boolean;
  cinematicFocus?: boolean;
}) {
  const { data: plans, isLoading } = usePlans();
  const { data: slots } = useSlots();
  const { data: settings } = useSettings();
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const phone = settingString(settings, "support_phone", "9559155535");

  const list = (plans ?? []).filter((p) => (filter ? filter(p.code) : true));

  useEffect(() => {
    if (!cinematicFocus) return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { threshold: 0.3 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [cinematicFocus]);

  useEffect(() => {
    if (!cinematicFocus || !isVisible || isInteracting || list.length === 0) {
      setActiveCard(null);
      return;
    }

    let current = 0;
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    let gapTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const runCard = () => {
      if (cancelled) return;
      setActiveCard(current);
      focusTimer = setTimeout(() => {
        setActiveCard(null);
        const completedLastCard = current === list.length - 1;
        current = (current + 1) % list.length;
        gapTimer = setTimeout(runCard, completedLastCard ? 1500 : 750);
      }, 1900);
    };

    gapTimer = setTimeout(runCard, 700);

    return () => {
      cancelled = true;
      if (focusTimer) clearTimeout(focusTimer);
      if (gapTimer) clearTimeout(gapTimer);
      setActiveCard(null);
    };
  }, [cinematicFocus, isInteracting, isVisible, list.length]);

  return (
    <section ref={sectionRef} id="plans" className="relative overflow-hidden bg-gradient-olive py-20 text-cream">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="hero-orb -left-24 top-0 size-96 bg-accent/20" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
      <div className="max-w-2xl">
        <span className="pill-badge">Membership</span>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h2>
        <p className="mt-4 text-sm text-cream/90 sm:text-base">{subtitle}</p>
      </div>


      <div
        className={cinematicFocus ? "subscription-focus-stage mt-12 grid gap-6 lg:grid-cols-3" : "mt-12 grid gap-6 lg:grid-cols-3"}
      >
        {isLoading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[520px] rounded-3xl" />)
          : list.map((plan, index) => (
              <div
                key={plan.id}
                className={cinematicFocus ? "subscription-focus-card h-full" : "h-full"}
                data-focus-active={cinematicFocus && activeCard === index ? "true" : "false"}
                onPointerEnter={() => cinematicFocus && setIsInteracting(true)}
                onPointerLeave={() => cinematicFocus && setIsInteracting(false)}
                onFocusCapture={() => cinematicFocus && setIsInteracting(true)}
                onBlurCapture={(event) => {
                  if (cinematicFocus && !event.currentTarget.contains(event.relatedTarget)) setIsInteracting(false);
                }}
              >
                <PlanCard
                  plan={plan}
                  {...(() => {
                    const slot = slots?.find((s) => s.plan_code === plan.code);
                    return slot ? { slot } : {};
                  })()}
                  supportPhone={phone}
                  busy={sessionLoading}
                  onSubscribe={(code) => {
                    navigate({ to: "/payment", search: { plan: code } });
                  }}
                />
              </div>
            ))}
      </div>

      <p className="mt-6 text-xs text-cream/95">
        <span className="font-semibold text-accent">Admin-managed:</span> Slot counters update live
        from active and pending subscriptions. Payments are only marked successful after
        verification through the payment gateway — nothing is auto-confirmed.
      </p>
      </div>
    </section>

  );
}
