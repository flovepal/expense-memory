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
      categories: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          display_order: number
          icon: string | null
          id: string
          is_archived: boolean
          name: string
          transaction_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_archived?: boolean
          name: string
          transaction_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          decimal_digits: number
          id: string
          is_active: boolean
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          decimal_digits?: number
          id?: string
          is_active?: boolean
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          decimal_digits?: number
          id?: string
          is_active?: boolean
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_options: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          label: string
          question_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          question_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          question_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_type: string
          category_id: string | null
          created_at: string
          deleted_at: string | null
          display_order: number
          id: string
          is_archived: boolean
          is_required: boolean
          prompt: string
          subcategory_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answer_type: string
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          id?: string
          is_archived?: boolean
          is_required?: boolean
          prompt: string
          subcategory_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answer_type?: string
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          id?: string
          is_archived?: boolean
          is_required?: boolean
          prompt?: string
          subcategory_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          default_currency_id: string | null
          locale: string
          preferences: Json
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_currency_id?: string | null
          locale?: string
          preferences?: Json
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_currency_id?: string | null
          locale?: string
          preferences?: Json
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_default_currency_id_fkey"
            columns: ["default_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          deleted_at: string | null
          display_order: number
          icon: string | null
          id: string
          is_archived: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_answers: {
        Row: {
          answer_boolean: boolean | null
          answer_date: string | null
          answer_number: number | null
          answer_text: string | null
          created_at: string
          id: string
          question_id: string
          selected_option_id: string | null
          selected_option_ids: string[] | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          answer_boolean?: boolean | null
          answer_date?: string | null
          answer_number?: number | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id: string
          selected_option_id?: string | null
          selected_option_ids?: string[] | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          answer_boolean?: boolean | null
          answer_date?: string | null
          answer_number?: number | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id?: string
          selected_option_id?: string | null
          selected_option_ids?: string[] | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_answers_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_answers_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions_detailed"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_tags: {
        Row: {
          created_at: string
          tag_id: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions_detailed"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          deleted_at: string | null
          id: string
          note: string | null
          occurred_at: string
          subcategory_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          note?: string | null
          occurred_at?: string
          subcategory_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          note?: string | null
          occurred_at?: string
          subcategory_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          color: string | null
          created_at: string
          currency_id: string
          deleted_at: string | null
          display_order: number
          icon: string | null
          id: string
          initial_balance: number
          is_archived: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          currency_id: string
          deleted_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          initial_balance?: number
          is_archived?: boolean
          name: string
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          currency_id?: string
          deleted_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          initial_balance?: number
          is_archived?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      monthly_category_summary: {
        Row: {
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          month: string | null
          total_amount: number | null
          transaction_count: number | null
          transaction_type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_detailed: {
        Row: {
          amount: number | null
          answers: Json | null
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          currency_code: string | null
          currency_id: string | null
          currency_symbol: string | null
          id: string | null
          note: string | null
          occurred_at: string | null
          subcategory_id: string | null
          subcategory_name: string | null
          tags: Json | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string | null
          wallet_id: string | null
          wallet_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_balances: {
        Row: {
          currency_code: string | null
          currency_decimal_digits: number | null
          currency_id: string | null
          currency_symbol: string | null
          current_balance: number | null
          deleted_at: string | null
          is_archived: boolean | null
          name: string | null
          type: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_transaction: {
        Args: {
          p_amount: number
          p_answers: Json
          p_category_id: string
          p_note: string
          p_occurred_at: string
          p_subcategory_id: string
          p_tag_ids: string[]
          p_transaction_type: string
          p_wallet_id: string
        }
        Returns: {
          amount: number
          category_id: string
          created_at: string
          deleted_at: string | null
          id: string
          note: string | null
          occurred_at: string
          subcategory_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_transaction: {
        Args: {
          p_amount: number
          p_answers: Json
          p_category_id: string
          p_note: string
          p_occurred_at: string
          p_subcategory_id: string
          p_tag_ids: string[]
          p_transaction_id: string
          p_transaction_type: string
          p_wallet_id: string
        }
        Returns: {
          amount: number
          category_id: string
          created_at: string
          deleted_at: string | null
          id: string
          note: string | null
          occurred_at: string
          subcategory_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
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
