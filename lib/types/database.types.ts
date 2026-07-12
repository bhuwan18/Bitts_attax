export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Mirrors the `cards.rarity` check constraint in supabase/migrations/0001_init_schema.sql.
// `supabase gen types` can't infer this from a check constraint (only native Postgres
// enums), so it's hand-maintained here — keep in sync with the migration.
export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "super_rare"
  | "legend"
  | "limited"
  | "other"

// Mirrors the `profiles.role` check constraint in supabase/migrations/0007_admin_role.sql.
export type UserRole = "user" | "admin"

// Mirrors the `notifications.type` check constraint in
// supabase/migrations/0009_user_discovery_and_notifications.sql.
export type NotificationType =
  | "trade_proposed"
  | "trade_accepted"
  | "trade_rejected"
  | "trade_completed"
  | "trade_cancelled"

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      // Hand-added ahead of `supabase gen types` regeneration — defined in
      // supabase/migrations/0011_gamification_activity_and_achievements.sql.
      achievements: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          attributes: Json
          base_price: number | null
          created_at: string
          external_ref: string | null
          id: string
          image_url: string | null
          name: string
          ovr_rating: number | null
          // Hand-added ahead of `supabase gen types` regeneration — defined in
          // supabase/migrations/0016_cards_owned_count.sql, not yet applied.
          owned_count: number
          position: string | null
          rarity: Rarity
          season: string | null
          set_name: string | null
          source: string
          team: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json
          base_price?: number | null
          created_at?: string
          external_ref?: string | null
          id?: string
          image_url?: string | null
          name: string
          ovr_rating?: number | null
          owned_count?: number
          position?: string | null
          rarity: Rarity
          season?: string | null
          set_name?: string | null
          source?: string
          team?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json
          base_price?: number | null
          created_at?: string
          external_ref?: string | null
          id?: string
          image_url?: string | null
          name?: string
          ovr_rating?: number | null
          owned_count?: number
          position?: string | null
          rarity?: Rarity
          season?: string | null
          set_name?: string | null
          source?: string
          team?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fairness_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          ovr_weight: number
          price_weight: number
          rarity_weights: Json
          tolerance_pct: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          ovr_weight?: number
          price_weight?: number
          rarity_weights: Json
          tolerance_pct?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          ovr_weight?: number
          price_weight?: number
          rarity_weights?: Json
          tolerance_pct?: number
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          card_id: string
          condition: string | null
          created_at: string
          custom_image_url: string | null
          id: string
          notes: string | null
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          condition?: string | null
          created_at?: string
          custom_image_url?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          condition?: string | null
          created_at?: string
          custom_image_url?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          trade_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          trade_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          read_at: string | null
          trade_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          trade_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          trade_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      trade_items: {
        Row: {
          card_id: string
          id: string
          offered_by: string
          quantity: number
          trade_id: string
        }
        Insert: {
          card_id: string
          id?: string
          offered_by: string
          quantity?: number
          trade_id: string
        }
        Update: {
          card_id?: string
          id?: string
          offered_by?: string
          quantity?: number
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_offered_by_fkey"
            columns: ["offered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_listing_items: {
        Row: {
          card_id: string
          id: string
          listing_id: string
          quantity: number
          side: string
        }
        Insert: {
          card_id: string
          id?: string
          listing_id: string
          quantity?: number
          side: string
        }
        Update: {
          card_id?: string
          id?: string
          listing_id?: string
          quantity?: number
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_listing_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_listing_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "trade_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_listings: {
        Row: {
          created_at: string
          fairness_score: number | null
          id: string
          owner_id: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fairness_score?: number | null
          id?: string
          owner_id: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fairness_score?: number | null
          id?: string
          owner_id?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // initiator_completed_at/counterparty_completed_at hand-added ahead of
      // `supabase gen types` regeneration — defined in
      // supabase/migrations/0015_trade_completion_confirmations.sql.
      trades: {
        Row: {
          counterparty_completed_at: string | null
          counterparty_id: string
          created_at: string
          fairness_breakdown: Json | null
          fairness_score: number | null
          id: string
          initiator_completed_at: string | null
          initiator_id: string
          listing_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          counterparty_completed_at?: string | null
          counterparty_id: string
          created_at?: string
          fairness_breakdown?: Json | null
          fairness_score?: number | null
          id?: string
          initiator_completed_at?: string | null
          initiator_id: string
          listing_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          counterparty_completed_at?: string | null
          counterparty_id?: string
          created_at?: string
          fairness_breakdown?: Json | null
          fairness_score?: number | null
          id?: string
          initiator_completed_at?: string | null
          initiator_id?: string
          listing_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "trade_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      // Hand-added ahead of `supabase gen types` regeneration — defined in
      // supabase/migrations/0011_gamification_activity_and_achievements.sql.
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      want_items: {
        Row: {
          card_id: string
          created_at: string
          id: string
          priority: number
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          priority?: number
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          priority?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "want_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "want_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      // Hand-added ahead of `supabase gen types` regeneration — defined in
      // supabase/migrations/0006_cards_filter_facets.sql, not yet applied.
      cards_distinct_teams: { Args: never; Returns: { team: string }[] }
      cards_distinct_set_names: { Args: never; Returns: { set_name: string }[] }
      // Hand-added ahead of `supabase gen types` regeneration — defined in
      // supabase/migrations/0012_trade_matches_rpc.sql, not yet applied.
      find_trade_matches: {
        Args: never
        Returns: { other_user_id: string; they_have_count: number; mutual: boolean }[]
      }
      // Hand-added ahead of `supabase gen types` regeneration — defined in
      // supabase/migrations/0017_match_cards_by_text.sql, not yet applied.
      match_cards_by_text: {
        Args: {
          p_name: string
          p_team?: string | null
          p_set_name?: string | null
          match_count?: number
        }
        Returns: {
          attributes: Json
          base_price: number | null
          created_at: string
          external_ref: string | null
          id: string
          image_url: string | null
          name: string
          ovr_rating: number | null
          owned_count: number
          position: string | null
          rarity: Rarity
          season: string | null
          set_name: string | null
          source: string
          team: string | null
          updated_at: string
        }[]
      }
      // Hand-added ahead of `supabase gen types` regeneration — defined in
      // supabase/migrations/0015_trade_completion_confirmations.sql.
      confirm_trade_completion: {
        Args: { p_trade_id: string }
        Returns: {
          counterparty_completed_at: string | null
          counterparty_id: string
          created_at: string
          fairness_breakdown: Json | null
          fairness_score: number | null
          id: string
          initiator_completed_at: string | null
          initiator_id: string
          listing_id: string | null
          status: string
          updated_at: string
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

// Convenience row aliases — not part of the Supabase-generated shape above,
// hand-added here because the rest of the app imports them directly instead
// of writing Database["public"]["Tables"][x]["Row"] at every call site.
export type Card = Database["public"]["Tables"]["cards"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Trade = Database["public"]["Tables"]["trades"]["Row"]
export type TradeListing = Database["public"]["Tables"]["trade_listings"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"]
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"]
