export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          category: 'camisetas' | 'shorts' | 'equipamentos'
          description: string | null
          purchase_price: number
          sale_price: number
          profit_margin: number
          stock: number
          min_stock: number
          sizes: Json | null
          colors: Json | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'camisetas' | 'shorts' | 'equipamentos'
          description?: string | null
          purchase_price: number
          sale_price: number
          profit_margin?: number
          stock?: number
          min_stock?: number
          sizes?: Json | null
          colors?: Json | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'camisetas' | 'shorts' | 'equipamentos'
          description?: string | null
          purchase_price?: number
          sale_price?: number
          profit_margin?: number
          stock?: number
          min_stock?: number
          sizes?: Json | null
          colors?: Json | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          student_name: string
          student_email: string
          student_phone: string
          total_amount: number
          status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_name: string
          student_email: string
          student_phone: string
          total_amount: number
          status?: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_name?: string
          student_email?: string
          student_phone?: string
          total_amount?: number
          status?: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          size: string | null
          color: string | null
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          size?: string | null
          color?: string | null
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          size?: string | null
          color?: string | null
          unit_price?: number
          total_price?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_alerts: {
        Row: {
          id: string
          product_id: string
          current_stock: number
          min_stock: number
          alert_type: 'low_stock' | 'out_of_stock'
          is_resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          current_stock: number
          min_stock: number
          alert_type: 'low_stock' | 'out_of_stock'
          is_resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          current_stock?: number
          min_stock?: number
          alert_type?: 'low_stock' | 'out_of_stock'
          is_resolved?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
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
