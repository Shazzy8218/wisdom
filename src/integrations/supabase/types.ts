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
      chat_messages: {
        Row: {
          content: string
          id: string
          role: string
          thread_id: string
          timestamp: number
          user_id: string
        }
        Insert: {
          content?: string
          id: string
          role?: string
          thread_id: string
          timestamp?: number
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          role?: string
          thread_id?: string
          timestamp?: number
          user_id?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          archived: boolean
          created_at: number
          id: string
          lesson_id: string | null
          title: string
          updated_at: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: number
          id: string
          lesson_id?: string | null
          title?: string
          updated_at?: number
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: number
          id?: string
          lesson_id?: string | null
          title?: string
          updated_at?: number
          user_id?: string
        }
        Relationships: []
      }
      personalized_lessons: {
        Row: {
          completed: boolean
          content: string
          generated_at: number
          hook: string
          id: string
          source: string
          source_thread_id: string | null
          title: string
          try_prompt: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          content?: string
          generated_at?: number
          hook?: string
          id: string
          source?: string
          source_thread_id?: string | null
          title?: string
          try_prompt?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          content?: string
          generated_at?: number
          hook?: string
          id?: string
          source?: string
          source_thread_id?: string | null
          title?: string
          try_prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          answer_tone: string
          calibration_done: boolean
          created_at: string
          display_name: string
          email: string | null
          goal_mode: string
          id: string
          intensity: string
          last_login_at: string
          learning_goal: string | null
          learning_style: string
          output_mode: string
          plan: string
          primary_desire: string
        }
        Insert: {
          answer_tone?: string
          calibration_done?: boolean
          created_at?: string
          display_name?: string
          email?: string | null
          goal_mode?: string
          id: string
          intensity?: string
          last_login_at?: string
          learning_goal?: string | null
          learning_style?: string
          output_mode?: string
          plan?: string
          primary_desire?: string
        }
        Update: {
          answer_tone?: string
          calibration_done?: boolean
          created_at?: string
          display_name?: string
          email?: string | null
          goal_mode?: string
          id?: string
          intensity?: string
          last_login_at?: string
          learning_goal?: string | null
          learning_style?: string
          output_mode?: string
          plan?: string
          primary_desire?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          baseline_value: number
          completed: boolean
          created_at: string
          current_value: number
          deadline: string | null
          id: string
          roadmap: Json
          target_metric: string
          target_value: number
          title: string
          updated_at: string
          user_id: string
          why: string
        }
        Insert: {
          baseline_value?: number
          completed?: boolean
          created_at?: string
          current_value?: number
          deadline?: string | null
          id?: string
          roadmap?: Json
          target_metric?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id: string
          why?: string
        }
        Update: {
          baseline_value?: number
          completed?: boolean
          created_at?: string
          current_value?: number
          deadline?: string | null
          id?: string
          roadmap?: Json
          target_metric?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
          why?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_lessons: Json
          completed_modules: Json
          created_at: string
          favorites: Json
          feed_seen: Json
          generated_lesson_ids: Json
          id: string
          last_active_date: string
          lessons_today: number
          mastery_scores: Json
          quiz_scores: Json
          saved_notes: Json
          seen_quotes: Json
          streak: number
          token_history: Json
          tokens: number
          unlocked_items: Json
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          completed_lessons?: Json
          completed_modules?: Json
          created_at?: string
          favorites?: Json
          feed_seen?: Json
          generated_lesson_ids?: Json
          id?: string
          last_active_date?: string
          lessons_today?: number
          mastery_scores?: Json
          quiz_scores?: Json
          saved_notes?: Json
          seen_quotes?: Json
          streak?: number
          token_history?: Json
          tokens?: number
          unlocked_items?: Json
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          completed_lessons?: Json
          completed_modules?: Json
          created_at?: string
          favorites?: Json
          feed_seen?: Json
          generated_lesson_ids?: Json
          id?: string
          last_active_date?: string
          lessons_today?: number
          mastery_scores?: Json
          quiz_scores?: Json
          saved_notes?: Json
          seen_quotes?: Json
          streak?: number
          token_history?: Json
          tokens?: number
          unlocked_items?: Json
          updated_at?: string
          user_id?: string
          xp?: number
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
    Enums: {},
  },
} as const
