import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Plan = {
  id: string;
  code: string;
  name: string;
  tagline: string;
  daily_display: number;
  price: number;
  billing_period: string;
  discount_percentage: number;
  lead_limit: number;
  weekly_attempt_limit: number;
  leads_per_attempt: number;
  slot_limit: number | null;
  bank_executive_eligible: boolean;
  highlight: boolean;
  benefits: string[];
  sort_order: number;
};

export type SlotCount = {
  plan_code: string;
  slot_limit: number | null;
  occupied: number;
  remaining: number | null;
};

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });
}

export function useSlots() {
  return useQuery({
    queryKey: ["slots"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("plan_slot_counts");
      if (error) throw error;
      return (data ?? []) as unknown as SlotCount[];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("key,value");
      if (error) throw error;
      const map: Record<string, unknown> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return map;
    },
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOffers() {
  return useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("offers").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useQuote(planCode?: string) {
  return useQuery({
    queryKey: ["quote", planCode],
    enabled: !!planCode,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quote_for_plan", {
        _plan_code: planCode!,
        _first_payment: true,
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
  });
}

export function settingString(map: Record<string, unknown> | undefined, key: string, fallback: string) {
  const v = map?.[key];
  return typeof v === "string" && v ? v : fallback;
}

export function settingNumber(map: Record<string, unknown> | undefined, key: string, fallback: number) {
  const v = map?.[key];
  return typeof v === "number" ? v : fallback;
}
