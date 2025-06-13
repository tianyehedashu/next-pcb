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
      admin_orders: {
        Row: {
          admin_note: string | null
          admin_price: number | null
          approved_refund_amount: number | null
          cny_price: number | null
          coupon: number | null
          created_at: string
          currency: string | null
          custom_duty: number | null
          delivery_date: string | null
          due_date: string | null
          exchange_rate: number | null
          id: string
          pay_time: string | null
          payment_status: string
          pcb_price: number | null
          production_days: number | null
          refund_status: string | null
          requested_refund_amount: number | null
          ship_price: number | null
          status: string
          surcharges: Json | null
          updated_at: string
          user_id: string | null
          user_order_id: string
        }
        Insert: {
          admin_note?: string | null
          admin_price?: number | null
          approved_refund_amount?: number | null
          cny_price?: number | null
          coupon?: number | null
          created_at?: string
          currency?: string | null
          custom_duty?: number | null
          delivery_date?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: string
          pay_time?: string | null
          payment_status?: string
          pcb_price?: number | null
          production_days?: number | null
          refund_status?: string | null
          requested_refund_amount?: number | null
          ship_price?: number | null
          status?: string
          surcharges?: Json | null
          updated_at?: string
          user_id?: string | null
          user_order_id: string
        }
        Update: {
          admin_note?: string | null
          admin_price?: number | null
          approved_refund_amount?: number | null
          cny_price?: number | null
          coupon?: number | null
          created_at?: string
          currency?: string | null
          custom_duty?: number | null
          delivery_date?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: string
          pay_time?: string | null
          payment_status?: string
          pcb_price?: number | null
          production_days?: number | null
          refund_status?: string | null
          requested_refund_amount?: number | null
          ship_price?: number | null
          status?: string
          surcharges?: Json | null
          updated_at?: string
          user_id?: string | null
          user_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_orders_user_order_id"
            columns: ["user_order_id"]
            isOneToOne: true
            referencedRelation: "pcb_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          estimated_delivery_date: string | null
          gerber_file_url: string | null
          id: string
          payment_status: string | null
          pcb_spec: Json
          production_days: number | null
          quote_id: string | null
          quoted_price: number | null
          shipping_address: Json
          shipping_cost: number | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
          user_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          estimated_delivery_date?: string | null
          gerber_file_url?: string | null
          id?: string
          payment_status?: string | null
          pcb_spec: Json
          production_days?: number | null
          quote_id?: string | null
          quoted_price?: number | null
          shipping_address: Json
          shipping_cost?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          estimated_delivery_date?: string | null
          gerber_file_url?: string | null
          id?: string
          payment_status?: string | null
          pcb_spec?: Json
          production_days?: number | null
          quote_id?: string | null
          quoted_price?: number | null
          shipping_address?: Json
          shipping_cost?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "pcb_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      pcb_quotes: {
        Row: {
          cal_values: Json | null
          created_at: string | null
          email: string
          gerber_file_url: string | null
          id: string
          payment_intent_id: string | null
          pcb_spec: Json
          phone: string | null
          shipping_address: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          cal_values?: Json | null
          created_at?: string | null
          email: string
          gerber_file_url?: string | null
          id?: string
          payment_intent_id?: string | null
          pcb_spec: Json
          phone?: string | null
          shipping_address?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          cal_values?: Json | null
          created_at?: string | null
          email?: string
          gerber_file_url?: string | null
          id?: string
          payment_intent_id?: string | null
          pcb_spec?: Json
          phone?: string | null
          shipping_address?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      pcb_services: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          price: number
          service_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          price: number
          service_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          price?: number
          service_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string | null
          id: string
          last_login: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          id: string
          last_login?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          last_login?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address: string
          city: string | null
          city_name: string | null
          contact_name: string
          country: string
          country_name: string | null
          courier: string | null
          courier_name: string | null
          created_at: string | null
          id: number
          is_default: boolean | null
          label: string | null
          phone: string
          state: string | null
          state_name: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address: string
          city?: string | null
          city_name?: string | null
          contact_name: string
          country: string
          country_name?: string | null
          courier?: string | null
          courier_name?: string | null
          created_at?: string | null
          id?: number
          is_default?: boolean | null
          label?: string | null
          phone: string
          state?: string | null
          state_name?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          city_name?: string | null
          contact_name?: string
          country?: string
          country_name?: string | null
          courier?: string | null
          courier_name?: string | null
          created_at?: string | null
          id?: number
          is_default?: boolean | null
          label?: string | null
          phone?: string
          state?: string | null
          state_name?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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