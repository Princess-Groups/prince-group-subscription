import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export type Business = {
  id: string;
  business_name: string;
  category: string;
  business_type: string | null;
  location: string | null;
  district: string | null;
  status: string;
  is_demo: boolean;
  description: string;
  services: string[] | null;
  website: string | null;
  social_links: Record<string, boolean> | null;
  contact_locked: boolean;
  is_premium: boolean;
  is_popular: boolean;
  created_at: string;
};

export type Opportunity = {
  id: string;
  title: string;
  category: string;
  opportunity_type: string;
  location: string;
  description: string;
  business_id: string | null;
  lead_id: string | null;
  potential_value: string | null;
  contact_locked: boolean;
  status: string;
  premium_only: boolean;
  created_at: string;
};

const BUSINESS_FIELDS =
  "id,business_name,category,business_type,location,district,status,is_demo,description,services,website,social_links,contact_locked,is_premium,is_popular,created_at";

export function useBusinesses() {
  return useQuery({
    queryKey: ["directory-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_contacts")
        .select(BUSINESS_FIELDS)
        .order("business_name")
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Business[];
    },
  });
}

export function useOpportunities() {
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      return (data ?? []) as unknown as Opportunity[];
    },
  });
}

function unlockMessage(code: string) {
  switch (code) {
    case "not_authenticated":
      return "Sign in to use your subscription access.";
    case "no_active_subscription":
      return "An active subscription is required to unlock contacts.";
    case "contact_not_published":
      return "This contact is pending verification by our team.";
    case "not_allocated":
      return "Allocate this record to your account from the dashboard first.";
    default:
      return "Unable to unlock right now.";
  }
}

export function useUnlockBusinessContact(
  onUnlocked: (id: string, phone: string) => void,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("reveal_business_contact", {
        _business_id: id,
      });
      if (error) throw error;
      return { id, res: (data ?? {}) as Record<string, unknown> };
    },
    onSuccess: ({ id, res }) => {
      const err = res["error"];
      if (typeof err === "string") {
        toast.error(unlockMessage(err));
        return;
      }
      onUnlocked(id, String(res["phone"] ?? ""));
      toast.success("Contact unlocked — this view has been logged.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUnlockLeadContact(
  onUnlocked: (id: string, phone: string) => void,
) {
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc("reveal_lead_contact", {
        _lead_id: leadId,
      });
      if (error) throw error;
      return { leadId, res: (data ?? {}) as Record<string, unknown> };
    },
    onSuccess: ({ leadId, res }) => {
      const err = res["error"];
      if (typeof err === "string") {
        toast.error(unlockMessage(err));
        return;
      }
      onUnlocked(leadId, String(res["phone"] ?? ""));
      toast.success("Candidate contact unlocked — this view has been logged.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
