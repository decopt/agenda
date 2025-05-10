export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string | null
          data: string | null
          email: string | null
          empresa_id: string | null
          hora: string | null
          id: string
          nome: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          email?: string | null
          empresa_id?: string | null
          hora?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          email?: string | null
          empresa_id?: string | null
          hora?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string
          created_at: string
          id: string
          notes: string | null
          scheduled_at: string
          service_id: string | null
          servico: string | null
          staff_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone: string
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at: string
          service_id?: string | null
          servico?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at?: string
          service_id?: string | null
          servico?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      available_hours: {
        Row: {
          created_at: string
          end_time: string
          id: string
          lunch_break_end: string | null
          lunch_break_start: string | null
          start_time: string
          updated_at: string
          user_id: string
          weekday: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          lunch_break_end?: string | null
          lunch_break_start?: string | null
          start_time: string
          updated_at?: string
          user_id: string
          weekday: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          lunch_break_end?: string | null
          lunch_break_start?: string | null
          start_time?: string
          updated_at?: string
          user_id?: string
          weekday?: string
        }
        Relationships: []
      }
      company_config: {
        Row: {
          address: string | null
          color_theme: string | null
          company_name: string | null
          created_at: string
          custom_url: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          monthly_limit: number
          phone: string | null
          plan_type: string
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          address?: string | null
          color_theme?: string | null
          company_name?: string | null
          created_at?: string
          custom_url?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_limit?: number
          phone?: string | null
          plan_type?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          address?: string | null
          color_theme?: string | null
          company_name?: string | null
          created_at?: string
          custom_url?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_limit?: number
          phone?: string | null
          plan_type?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          agendamentos_mes: number | null
          business_description: string | null
          company_name: string | null
          companyName: string | null
          created_at: string
          custom_url: string | null
          description: string | null
          id: string
          logo_url: string | null
          phone: string | null
          plan: string | null
          responsible_name: string | null
          responsibleName: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          agendamentos_mes?: number | null
          business_description?: string | null
          company_name?: string | null
          companyName?: string | null
          created_at?: string
          custom_url?: string | null
          description?: string | null
          id: string
          logo_url?: string | null
          phone?: string | null
          plan?: string | null
          responsible_name?: string | null
          responsibleName?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          agendamentos_mes?: number | null
          business_description?: string | null
          company_name?: string | null
          companyName?: string | null
          created_at?: string
          custom_url?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          plan?: string | null
          responsible_name?: string | null
          responsibleName?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles_duplicatebackup: {
        Row: {
          company_name: string | null
          created_at: string
          custom_url: string | null
          id: string
          responsible_name: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          custom_url?: string | null
          id: string
          responsible_name?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          custom_url?: string | null
          id?: string
          responsible_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          duration: number
          id: string
          name: string | null
          price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          name?: string | null
          price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name?: string | null
          price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_services: {
        Row: {
          created_at: string | null
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_clients_with_stats: {
        Args: { p_user_id: string }
        Returns: {
          client_name: string
          client_email: string
          client_phone: string
          appointment_count: number
          last_appointment: string
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
