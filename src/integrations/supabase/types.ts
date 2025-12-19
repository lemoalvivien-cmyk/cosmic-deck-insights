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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      ai_prompt_templates: {
        Row: {
          content: string
          description: string | null
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          content: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          content?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_daily: {
        Row: {
          count: number
          day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          admin_bootstrap_used: boolean
          enable_billing: boolean | null
          enable_shop: boolean | null
          enable_waitlist: boolean | null
          id: number
          maintenance_mode: boolean | null
          updated_at: string
        }
        Insert: {
          admin_bootstrap_used?: boolean
          enable_billing?: boolean | null
          enable_shop?: boolean | null
          enable_waitlist?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          updated_at?: string
        }
        Update: {
          admin_bootstrap_used?: boolean
          enable_billing?: boolean | null
          enable_shop?: boolean | null
          enable_waitlist?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          intention: string | null
          onboarding_completed: boolean | null
          preferred_domain: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          intention?: string | null
          onboarding_completed?: boolean | null
          preferred_domain?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          intention?: string | null
          onboarding_completed?: boolean | null
          preferred_domain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tarot_cards: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          keywords: string[] | null
          keywords_fr: string[] | null
          meaning_reversed: string | null
          meaning_reversed_fr: string | null
          meaning_upright: string | null
          meaning_upright_fr: string | null
          name_en: string | null
          nom_fr: string
          numero: number | null
          type: Database["public"]["Enums"]["card_type"]
        }
        Insert: {
          created_at?: string
          id: string
          image_url?: string | null
          keywords?: string[] | null
          keywords_fr?: string[] | null
          meaning_reversed?: string | null
          meaning_reversed_fr?: string | null
          meaning_upright?: string | null
          meaning_upright_fr?: string | null
          name_en?: string | null
          nom_fr: string
          numero?: number | null
          type: Database["public"]["Enums"]["card_type"]
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          keywords_fr?: string[] | null
          meaning_reversed?: string | null
          meaning_reversed_fr?: string | null
          meaning_upright?: string | null
          meaning_upright_fr?: string | null
          name_en?: string | null
          nom_fr?: string
          numero?: number | null
          type?: Database["public"]["Enums"]["card_type"]
        }
        Relationships: []
      }
      tarot_readings: {
        Row: {
          ai_interpretation: Json | null
          cards: Json
          created_at: string
          id: string
          is_favorite: boolean | null
          question: string | null
          spread_id: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          ai_interpretation?: Json | null
          cards?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          question?: string | null
          spread_id?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          ai_interpretation?: Json | null
          cards?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          question?: string | null
          spread_id?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarot_readings_spread_id_fkey"
            columns: ["spread_id"]
            isOneToOne: false
            referencedRelation: "tarot_spreads"
            referencedColumns: ["id"]
          },
        ]
      }
      tarot_spreads: {
        Row: {
          card_count: number
          created_at: string
          description: string | null
          description_fr: string | null
          id: string
          name: string
          name_fr: string
          positions: Json
        }
        Insert: {
          card_count?: number
          created_at?: string
          description?: string | null
          description_fr?: string | null
          id: string
          name: string
          name_fr: string
          positions?: Json
        }
        Update: {
          card_count?: number
          created_at?: string
          description?: string | null
          description_fr?: string | null
          id?: string
          name?: string
          name_fr?: string
          positions?: Json
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      bootstrap_first_admin: {
        Args: { allowed_email: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      card_type: "major" | "minor"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
      card_type: ["major", "minor"],
    },
  },
} as const
