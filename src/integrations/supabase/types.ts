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
      admin_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      catalog_categories: {
        Row: {
          created_at: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_novels: {
        Row: {
          author: string | null
          cats: string[]
          format: string
          hidden: boolean
          name: string
          playlist: string | null
          slug: string
          subtitle: string | null
          updated_at: string
          urdu: string | null
        }
        Insert: {
          author?: string | null
          cats?: string[]
          format?: string
          hidden?: boolean
          name: string
          playlist?: string | null
          slug: string
          subtitle?: string | null
          updated_at?: string
          urdu?: string | null
        }
        Update: {
          author?: string | null
          cats?: string[]
          format?: string
          hidden?: boolean
          name?: string
          playlist?: string | null
          slug?: string
          subtitle?: string | null
          updated_at?: string
          urdu?: string | null
        }
        Relationships: []
      }
      catalog_videos: {
        Row: {
          created_at: string
          duration_sec: number
          ep: number | null
          hidden: boolean
          novel_slug: string
          published_at: string | null
          season: number | null
          share_url: string | null
          source: string
          thumb_url: string | null
          title: string
          updated_at: string
          video_id: string
          views: number
        }
        Insert: {
          created_at?: string
          duration_sec?: number
          ep?: number | null
          hidden?: boolean
          novel_slug: string
          published_at?: string | null
          season?: number | null
          share_url?: string | null
          source?: string
          thumb_url?: string | null
          title: string
          updated_at?: string
          video_id: string
          views?: number
        }
        Update: {
          created_at?: string
          duration_sec?: number
          ep?: number | null
          hidden?: boolean
          novel_slug?: string
          published_at?: string | null
          season?: number | null
          share_url?: string | null
          source?: string
          thumb_url?: string | null
          title?: string
          updated_at?: string
          video_id?: string
          views?: number
        }
        Relationships: []
      }
      feedback: {
        Row: {
          contact: string
          created_at: string
          id: string
          message: string
          name: string
        }
        Insert: {
          contact?: string
          created_at?: string
          id?: string
          message: string
          name: string
        }
        Update: {
          contact?: string
          created_at?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      legacy_user_imports: {
        Row: {
          claimed_at: string | null
          cloud_user_id: string | null
          email: string
          legacy_user_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          claimed_at?: string | null
          cloud_user_id?: string | null
          email: string
          legacy_user_id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          claimed_at?: string | null
          cloud_user_id?: string | null
          email?: string
          legacy_user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      novel_pdfs: {
        Row: {
          file_path: string
          file_size: number | null
          novel_slug: string
          uploaded_at: string
        }
        Insert: {
          file_path: string
          file_size?: number | null
          novel_slug: string
          uploaded_at?: string
        }
        Update: {
          file_path?: string
          file_size?: number | null
          novel_slug?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      novel_stats: {
        Row: {
          novel_slug: string
          pdf_downloads: number
          pdf_reads: number
          updated_at: string
          views: number
        }
        Insert: {
          novel_slug: string
          pdf_downloads?: number
          pdf_reads?: number
          updated_at?: string
          views?: number
        }
        Update: {
          novel_slug?: string
          pdf_downloads?: number
          pdf_reads?: number
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          name: string
          novel_slug: string
          rating: number
          replied_at: string | null
          reply: string | null
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          name: string
          novel_slug: string
          rating: number
          replied_at?: string | null
          reply?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          name?: string
          novel_slug?: string
          rating?: number
          replied_at?: string | null
          reply?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      bump_stat: { Args: { _kind: string; _slug: string }; Returns: undefined }
      get_latest_reviews: {
        Args: never
        Returns: {
          comment: string
          created_at: string
          id: string
          name: string
          novel_slug: string
          rating: number
          replied_at: string
          reply: string
        }[]
      }
      get_novel_rating: {
        Args: { _slug: string }
        Returns: {
          avg_rating: number
          rating_count: number
        }[]
      }
      get_novel_reviews: {
        Args: { _slug: string }
        Returns: {
          comment: string
          created_at: string
          id: string
          name: string
          rating: number
          replied_at: string
          reply: string
        }[]
      }
      get_novel_stats: {
        Args: { _slug: string }
        Returns: {
          pdf_downloads: number
          pdf_reads: number
          views: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_registered_pdf: { Args: { _path: string }; Returns: boolean }
      list_novel_pdfs: {
        Args: never
        Returns: {
          file_size: number
          novel_slug: string
          uploaded_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
