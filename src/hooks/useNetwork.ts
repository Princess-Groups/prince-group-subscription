import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type NetworkAccess = {
  authenticated: boolean;
  active: boolean;
  is_admin?: boolean;
  has_profile?: boolean;
  blocked?: boolean;
};

export type MemberCardData = {
  user_id: string | null;
  full_name: string;
  photo_url: string | null;
  company_logo_url: string | null;
  company_name: string;
  designation: string;
  category: string;
  location: string;
  about_company: string;
  products_services: string;
  what_we_offer: string;
  what_we_need: string;
  featured: boolean;
  locked: boolean;
};

export type MemberDetail = {
  user_id: string;
  full_name: string;
  photo_url: string | null;
  company_name: string;
  company_logo_url: string | null;
  designation: string;
  category: string;
  location: string;
  about_me: string;
  about_company: string;
  products_services: string;
  what_we_offer: string;
  what_we_need: string;
  website: string | null;
  business_email: string | null;
  business_phone: string | null;
  preferred_contact: string;
  featured: boolean;
  created_at: string;
  error?: string;
};

export type EnquiryCardData = {
  id: string;
  title: string;
  enquiry_type: string;
  category: string;
  description: string;
  what_i_need: string | null;
  what_i_offer: string | null;
  location: string;
  status: string;
  featured: boolean;
  created_at: string;
  author_id: string | null;
  author_name: string;
  author_company: string | null;
  locked: boolean;
};

export type ConversationSummary = {
  id: string;
  is_group: boolean;
  title: string;
  avatar: string | null;
  other_user_id: string | null;
  participants: number;
  last_message: string | null;
  last_message_at: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  body: string;
  attachment_path: string | null;
  sender_id: string;
  sender_name: string;
  created_at: string;
  mine: boolean;
};

export const ENQUIRY_TYPES = [
  "I Need",
  "I Offer",
  "Looking For",
  "Available For",
  "Partnership Required",
  "Business Requirement",
  "Product Requirement",
  "Service Requirement",
  "Hiring Requirement",
  "Sales / Purchase Requirement",
] as const;

export function useNetworkAccess() {
  return useQuery({
    queryKey: ["network-access"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_network_access");
      if (error) throw error;
      return data as unknown as NetworkAccess;
    },
  });
}

export function useMemberCategories() {
  return useQuery({
    queryKey: ["member-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_categories")
        .select("id,name,icon,sort_order")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMemberSearch(params: {
  q: string;
  category: string;
  location: string;
  page: number;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? 12;
  return useQuery({
    queryKey: ["member-search", params.q, params.category, params.location, params.page, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_members", {
        _q: params.q,
        _category: params.category,
        _location: params.location,
        _limit: pageSize,
        _offset: params.page * pageSize,
      });
      if (error) throw error;
      return data as unknown as { rows: MemberCardData[]; total: number; subscribed: boolean };
    },
    placeholderData: (prev) => prev,
  });
}

export function useEnquirySearch(params: { q: string; category: string; type: string; page: number }) {
  const pageSize = 12;
  return useQuery({
    queryKey: ["enquiry-search", params.q, params.category, params.type, params.page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_enquiries", {
        _q: params.q,
        _category: params.category,
        _type: params.type,
        _limit: pageSize,
        _offset: params.page * pageSize,
      });
      if (error) throw error;
      return data as unknown as { rows: EnquiryCardData[]; total: number; subscribed: boolean };
    },
    placeholderData: (prev) => prev,
  });
}

export function useMemberDetail(userId?: string) {
  return useQuery({
    queryKey: ["member-detail", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_member_profile", { _user_id: userId! });
      if (error) throw error;
      return data as unknown as MemberDetail;
    },
  });
}

export function useMyMemberProfile(userId?: string) {
  return useQuery({
    queryKey: ["my-member-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyEnquiries(userId?: string) {
  return useQuery({
    queryKey: ["my-enquiries", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_enquiries")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useConversations(enabled: boolean) {
  return useQuery({
    queryKey: ["my-conversations"],
    enabled,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_conversations");
      if (error) throw error;
      return data as unknown as ConversationSummary[];
    },
  });
}

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["conversation-messages", conversationId],
    enabled: !!conversationId,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("conversation_messages", {
        _conversation_id: conversationId!,
        _limit: 100,
      });
      if (error) throw error;
      return data as unknown as ChatMessage[];
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId: string; body: string; attachmentPath?: string | null }) => {
      const { data, error } = await supabase.rpc("send_message", {
        _conversation_id: input.conversationId,
        _body: input.body,
        _attachment_path: input.attachmentPath ?? undefined,
      });
      if (error) throw error;
      const res = data as unknown as { error?: string };
      if (res?.error) throw new Error(res.error);
      return res;
    },
    onSuccess: (_r, input) => {
      void queryClient.invalidateQueries({ queryKey: ["conversation-messages", input.conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["my-conversations"] });
    },
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data, error } = await supabase.rpc("start_direct_conversation", { _other_user: otherUserId });
      if (error) throw error;
      const res = data as unknown as { conversation_id?: string; error?: string };
      if (res?.error) throw new Error(res.error);
      return res.conversation_id!;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-conversations"] }),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; members: string[] }) => {
      const { data, error } = await supabase.rpc("create_group_conversation", {
        _title: input.title,
        _members: input.members,
      });
      if (error) throw error;
      const res = data as unknown as { conversation_id?: string; error?: string };
      if (res?.error) throw new Error(res.error);
      return res.conversation_id!;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-conversations"] }),
  });
}

export function useReport() {
  return useMutation({
    mutationFn: async (input: { targetType: string; targetId: string; reason: string; details?: string }) => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("not_authenticated");
      const { error } = await supabase.from("member_reports").insert({
        reporter_id: session.user.id,
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason,
        details: input.details ?? "",
      });
      if (error) throw error;
    },
  });
}

export function useBlockMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("not_authenticated");
      const { error } = await supabase
        .from("member_blocks")
        .insert({ blocker_id: session.user.id, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["member-search"] }),
  });
}

export function useRequestConnect() {
  return useMutation({
    mutationFn: async (input: { toUser: string; note?: string; enquiryId?: string | null }) => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("not_authenticated");
      const { error } = await supabase.from("connection_requests").upsert(
        {
          from_user: session.user.id,
          to_user: input.toUser,
          note: input.note ?? "",
          enquiry_id: input.enquiryId ?? null,
        },
        { onConflict: "from_user,to_user" },
      );
      if (error) throw error;
    },
  });
}

export function useLogCall() {
  return useMutation({
    mutationFn: async (input: { calleeId: string; conversationId?: string | null; status: string }) => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("not_authenticated");
      const { data, error } = await supabase
        .from("member_calls")
        .insert({
          caller_id: session.user.id,
          callee_id: input.calleeId,
          conversation_id: input.conversationId ?? null,
          status: input.status,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
