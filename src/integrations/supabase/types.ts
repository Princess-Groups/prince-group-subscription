export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      business_contacts: {
        Row: {
          business_name: string
          business_type: string | null
          category: string | null
          contact_locked: boolean
          created_at: string
          description: string
          district: string | null
          id: string
          is_demo: boolean
          is_popular: boolean
          is_premium: boolean
          location: string | null
          phone: string | null
          services: string[]
          social_links: Json
          status: string
          website: string | null
        }
        Insert: {
          business_name: string
          business_type?: string | null
          category?: string | null
          contact_locked?: boolean
          created_at?: string
          description?: string
          district?: string | null
          id?: string
          is_demo?: boolean
          is_popular?: boolean
          is_premium?: boolean
          location?: string | null
          phone?: string | null
          services?: string[]
          social_links?: Json
          status?: string
          website?: string | null
        }
        Update: {
          business_name?: string
          business_type?: string | null
          category?: string | null
          contact_locked?: boolean
          created_at?: string
          description?: string
          district?: string | null
          id?: string
          is_demo?: boolean
          is_popular?: boolean
          is_premium?: boolean
          location?: string | null
          phone?: string | null
          services?: string[]
          social_links?: Json
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      contact_access_logs: {
        Row: {
          accessed_at: string
          action: string
          business_contact_id: string | null
          id: string
          lead_id: string | null
          plan_code: string | null
          status: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action?: string
          business_contact_id?: string | null
          id?: string
          lead_id?: string | null
          plan_code?: string | null
          status?: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          business_contact_id?: string | null
          id?: string
          lead_id?: string | null
          plan_code?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_access_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_allocations: {
        Row: {
          allocated_at: string
          id: string
          lead_id: string
          plan_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          allocated_at?: string
          id?: string
          lead_id: string
          plan_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          allocated_at?: string
          id?: string
          lead_id?: string
          plan_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_allocations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_allocations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_attempts: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          user_id: string
          week_identifier: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          user_id: string
          week_identifier: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          user_id?: string
          week_identifier?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          eligibility: string | null
          estimated_amount: number | null
          id: string
          is_demo: boolean
          lead_code: string
          loan_type: string | null
          location: string | null
          name: string
          phone: string
          requirement: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          created_at?: string
          eligibility?: string | null
          estimated_amount?: number | null
          id?: string
          is_demo?: boolean
          lead_code?: string
          loan_type?: string | null
          location?: string | null
          name: string
          phone: string
          requirement?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          created_at?: string
          eligibility?: string | null
          estimated_amount?: number | null
          id?: string
          is_demo?: boolean
          lead_code?: string
          loan_type?: string | null
          location?: string | null
          name?: string
          phone?: string
          requirement?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          active: boolean
          applicable_plan: string | null
          code: string | null
          description: string
          discount: number
          end_date: string | null
          id: string
          start_date: string | null
          title: string
        }
        Insert: {
          active?: boolean
          applicable_plan?: string | null
          code?: string | null
          description?: string
          discount?: number
          end_date?: string | null
          id?: string
          start_date?: string | null
          title: string
        }
        Update: {
          active?: boolean
          applicable_plan?: string | null
          code?: string | null
          description?: string
          discount?: number
          end_date?: string | null
          id?: string
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          business_id: string | null
          category: string
          contact_locked: boolean
          created_at: string
          description: string
          id: string
          is_demo: boolean
          lead_id: string | null
          location: string
          opportunity_type: string
          potential_value: string | null
          premium_only: boolean
          status: string
          title: string
        }
        Insert: {
          business_id?: string | null
          category: string
          contact_locked?: boolean
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          location?: string
          opportunity_type: string
          potential_value?: string | null
          premium_only?: boolean
          status?: string
          title: string
        }
        Update: {
          business_id?: string | null
          category?: string
          contact_locked?: boolean
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          location?: string
          opportunity_type?: string
          potential_value?: string | null
          premium_only?: boolean
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          application_fee: number
          base_amount: number
          created_at: string
          discount: number
          gst: number
          id: string
          paid_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: Database["public"]["Enums"]["pay_status"]
          subscription_id: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          application_fee?: number
          base_amount?: number
          created_at?: string
          discount?: number
          gst?: number
          id?: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["pay_status"]
          subscription_id?: string | null
          total_amount?: number
          user_id: string
        }
        Update: {
          application_fee?: number
          base_amount?: number
          created_at?: string
          discount?: number
          gst?: number
          id?: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["pay_status"]
          subscription_id?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          bank_executive_eligible: boolean
          benefits: Json
          billing_period: string
          code: string
          daily_display: number
          discount_percentage: number
          highlight: boolean
          id: string
          lead_limit: number
          leads_per_attempt: number
          name: string
          price: number
          slot_limit: number | null
          sort_order: number
          tagline: string
          weekly_attempt_limit: number
        }
        Insert: {
          active?: boolean
          bank_executive_eligible?: boolean
          benefits?: Json
          billing_period?: string
          code: string
          daily_display?: number
          discount_percentage?: number
          highlight?: boolean
          id?: string
          lead_limit?: number
          leads_per_attempt?: number
          name: string
          price: number
          slot_limit?: number | null
          sort_order?: number
          tagline?: string
          weekly_attempt_limit?: number
        }
        Update: {
          active?: boolean
          bank_executive_eligible?: boolean
          benefits?: Json
          billing_period?: string
          code?: string
          daily_display?: number
          discount_percentage?: number
          highlight?: boolean
          id?: string
          lead_limit?: number
          leads_per_attempt?: number
          name?: string
          price?: number
          slot_limit?: number | null
          sort_order?: number
          tagline?: string
          weekly_attempt_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          employee_code: string | null
          id: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
        }
        Insert: {
          created_at?: string
          email?: string
          employee_code?: string | null
          id: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
        }
        Update: {
          created_at?: string
          email?: string
          employee_code?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          category: string
          description: string
          id: string
          name: string
          original_price: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          category: string
          description?: string
          id?: string
          name: string
          original_price?: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          category?: string
          description?: string
          id?: string
          name?: string
          original_price?: number
          sort_order?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          public_read: boolean
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          public_read?: boolean
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          public_read?: boolean
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          advance_period: string | null
          cancellation_date: string | null
          created_at: string
          id: string
          leads_used: number
          plan_id: string
          razorpay_subscription_id: string | null
          renewal_date: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["sub_status"]
          user_id: string
        }
        Insert: {
          advance_period?: string | null
          cancellation_date?: string | null
          created_at?: string
          id?: string
          leads_used?: number
          plan_id: string
          razorpay_subscription_id?: string | null
          renewal_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["sub_status"]
          user_id: string
        }
        Update: {
          advance_period?: string | null
          cancellation_date?: string | null
          created_at?: string
          id?: string
          leads_used?: number
          plan_id?: string
          razorpay_subscription_id?: string | null
          renewal_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["sub_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_lead: {
        Args: { _lead_id: string; _user_id: string }
        Returns: Json
      }
      admin_set_account_status: {
        Args: {
          _status: Database["public"]["Enums"]["account_status"]
          _user_id: string
        }
        Returns: Json
      }
      admin_set_subscription_status: {
        Args: {
          _status: Database["public"]["Enums"]["sub_status"]
          _sub_id: string
        }
        Returns: Json
      }
      admin_set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: Json
      }
      admin_stats: { Args: never; Returns: Json }
      cancel_my_subscription: { Args: never; Returns: Json }
      claim_leads: { Args: never; Returns: Json }
      claim_super_admin: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      my_dashboard: { Args: never; Returns: Json }
      plan_slot_counts: {
        Args: never
        Returns: {
          occupied: number
          plan_code: string
          remaining: number
          slot_limit: number
        }[]
      }
      quote_for_plan: {
        Args: { _first_payment?: boolean; _plan_code: string }
        Returns: Json
      }
      reserve_advance_period: { Args: { _period: string }; Returns: Json }
      reveal_business_contact: { Args: { _business_id: string }; Returns: Json }
      reveal_lead_contact: { Args: { _lead_id: string }; Returns: Json }
      setting_num: { Args: { _default: number; _key: string }; Returns: number }
      start_subscription: { Args: { _plan_code: string }; Returns: Json }
    }
    Enums: {
      account_status: "pending" | "active" | "suspended" | "rejected"
      app_role:
        | "super_admin"
        | "admin"
        | "customer"
        | "bank_executive"
        | "premium_bank_executive"
      lead_status: "new" | "assigned" | "contacted" | "converted" | "closed"
      pay_status: "created" | "pending" | "success" | "failed" | "refunded"
      sub_status:
        | "pending"
        | "active"
        | "payment_failed"
        | "paused"
        | "cancelled"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["pending", "active", "suspended", "rejected"],
      app_role: [
        "super_admin",
        "admin",
        "customer",
        "bank_executive",
        "premium_bank_executive",
      ],
      lead_status: ["new", "assigned", "contacted", "converted", "closed"],
      pay_status: ["created", "pending", "success", "failed", "refunded"],
      sub_status: [
        "pending",
        "active",
        "payment_failed",
        "paused",
        "cancelled",
        "expired",
      ],
    },
  },
} as const
