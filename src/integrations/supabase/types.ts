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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_state: {
        Row: {
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          data: Json
          key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      },
      strategi_strategies: {
        Row: { id: string; slug: string; title: string; source: string; situation_slug: string | null; situation_name: string | null; status: string; objective: string; context: string | null; audience: string | null; region: string | null; platforms: Json; approach: string | null; metadata: Json; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string; archived_at: string | null }
        Insert: { id?: string; slug: string; title: string; source: string; situation_slug?: string | null; situation_name?: string | null; status?: string; objective?: string; context?: string | null; audience?: string | null; region?: string | null; platforms?: Json; approach?: string | null; metadata?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null }
        Update: { id?: string; slug?: string; title?: string; source?: string; situation_slug?: string | null; situation_name?: string | null; status?: string; objective?: string; context?: string | null; audience?: string | null; region?: string | null; platforms?: Json; approach?: string | null; metadata?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null }
        Relationships: []
      },
      strategi_strategy_versions: {
        Row: { id: string; strategy_id: string; version_number: number; snapshot: Json; change_note: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; strategy_id: string; version_number: number; snapshot: Json; change_note?: string | null; created_by?: string | null; created_at?: string }
        Update: { id?: string; strategy_id?: string; version_number?: number; snapshot?: Json; change_note?: string | null; created_by?: string | null; created_at?: string }
        Relationships: []
      },
      strategi_approval_events: {
        Row: { id: string; strategy_id: string; version_number: number | null; event_type: string; reviewer_id: string | null; reviewer_label: string | null; note: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; strategy_id: string; version_number?: number | null; event_type: string; reviewer_id?: string | null; reviewer_label?: string | null; note?: string | null; created_by?: string | null; created_at?: string }
        Update: { id?: string; strategy_id?: string; version_number?: number | null; event_type?: string; reviewer_id?: string | null; reviewer_label?: string | null; note?: string | null; created_by?: string | null; created_at?: string }
        Relationships: []
      },
      strategi_evidence_sources: {
        Row: { id: string; strategy_id: string; statement: string; source_name: string; platform: string | null; source_url: string | null; source_time: string | null; verification_status: string; classification: string; note: string | null; metadata: Json; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; strategy_id: string; statement: string; source_name: string; platform?: string | null; source_url?: string | null; source_time?: string | null; verification_status?: string; classification?: string; note?: string | null; metadata?: Json; created_by?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; strategy_id?: string; statement?: string; source_name?: string; platform?: string | null; source_url?: string | null; source_time?: string | null; verification_status?: string; classification?: string; note?: string | null; metadata?: Json; created_by?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      },
      strategi_action_handoffs: {
        Row: { id: string; strategy_id: string; strategy_version: number | null; target_module: string; tasks: Json; handoff_status: string; created_by: string | null; created_at: string; metadata: Json }
        Insert: { id?: string; strategy_id: string; strategy_version?: number | null; target_module?: string; tasks?: Json; handoff_status?: string; created_by?: string | null; created_at?: string; metadata?: Json }
        Update: { id?: string; strategy_id?: string; strategy_version?: number | null; target_module?: string; tasks?: Json; handoff_status?: string; created_by?: string | null; created_at?: string; metadata?: Json }
        Relationships: []
      },
      strategi_archives: {
        Row: { id: string; strategy_id: string; version_number: number | null; snapshot: Json; archive_reason: string | null; archived_by: string | null; archived_at: string }
        Insert: { id?: string; strategy_id: string; version_number?: number | null; snapshot: Json; archive_reason?: string | null; archived_by?: string | null; archived_at?: string }
        Update: { id?: string; strategy_id?: string; version_number?: number | null; snapshot?: Json; archive_reason?: string | null; archived_by?: string | null; archived_at?: string }
        Relationships: []
      },
      situasi_system_findings: {
        Row: {
          actor_count: number
          created_at: string
          description: string
          detected_reason: string | null
          dominant_narrative: string | null
          growth: string | null
          keywords: string[]
          metadata: Json
          name: string
          narrative_count: number
          platforms: string[]
          region_scope: string
          regions_growing: string | null
          risk: string | null
          since_label: string
          slug: string
          status: string
          triggers: string[]
          updated_at: string
          volume: number
          warning_status: string | null
        }
        Insert: {
          actor_count?: number
          created_at?: string
          description?: string
          detected_reason?: string | null
          dominant_narrative?: string | null
          growth?: string | null
          keywords?: string[]
          metadata?: Json
          name: string
          narrative_count?: number
          platforms?: string[]
          region_scope?: string
          regions_growing?: string | null
          risk?: string | null
          since_label?: string
          slug: string
          status?: string
          triggers?: string[]
          updated_at?: string
          volume?: number
          warning_status?: string | null
        }
        Update: {
          actor_count?: number
          created_at?: string
          description?: string
          detected_reason?: string | null
          dominant_narrative?: string | null
          growth?: string | null
          keywords?: string[]
          metadata?: Json
          name?: string
          narrative_count?: number
          platforms?: string[]
          region_scope?: string
          regions_growing?: string | null
          risk?: string | null
          since_label?: string
          slug?: string
          status?: string
          triggers?: string[]
          updated_at?: string
          volume?: number
          warning_status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
