export interface Database {
  public: {
    Tables: {
      voyages: {
        Row: {
          id: string
          vessel_name: string | null
          voyage_no: string
          line_id: string | null
          terminal_id: string | null
          eta: string | null
          etd: string | null
          ata: string | null
          atd: string | null
          status: 'scheduled' | 'arrived' | 'departed' | 'canceled'
          created_at: string
        }
        Insert: {
          id?: string
          vessel_name?: string | null
          voyage_no: string
          line_id?: string | null
          terminal_id?: string | null
          eta?: string | null
          etd?: string | null
          ata?: string | null
          atd?: string | null
          status?: 'scheduled' | 'arrived' | 'departed' | 'canceled'
          created_at?: string
        }
        Update: {
          id?: string
          vessel_name?: string | null
          voyage_no?: string
          line_id?: string | null
          terminal_id?: string | null
          eta?: string | null
          etd?: string | null
          ata?: string | null
          atd?: string | null
          status?: 'scheduled' | 'arrived' | 'departed' | 'canceled'
          created_at?: string
        }
      }
      containers: {
        Row: {
          id: string
          cntr_no: string
          iso_type: string | null
          voyage_id: string | null
          bill_of_lading: string | null
          last_known_status: 'in_transit' | 'discharged' | 'available' | 'picked_up' | 'hold'
          last_status_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cntr_no: string
          iso_type?: string | null
          voyage_id?: string | null
          bill_of_lading?: string | null
          last_known_status?: 'in_transit' | 'discharged' | 'available' | 'picked_up' | 'hold'
          last_status_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cntr_no?: string
          iso_type?: string | null
          voyage_id?: string | null
          bill_of_lading?: string | null
          last_known_status?: 'in_transit' | 'discharged' | 'available' | 'picked_up' | 'hold'
          last_status_time?: string | null
          created_at?: string
        }
      }
      shipping_lines: {
        Row: {
          id: string
          scac: string | null
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          scac?: string | null
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          scac?: string | null
          name?: string
          created_at?: string
        }
      }
      terminals: {
        Row: {
          id: string
          code: string
          name: string
          timezone: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          timezone?: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          timezone?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          org_id: string | null
          created_by: string | null
          order_no: string
          status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          customer_name: string | null
          customer_email: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          created_by?: string | null
          order_no: string
          status?: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          customer_name?: string | null
          customer_email?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          created_by?: string | null
          order_no?: string
          status?: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          customer_name?: string | null
          customer_email?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_name: string | null
          quantity: number | null
          unit_price: number | null
          total_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_name?: string | null
          quantity?: number | null
          unit_price?: number | null
          total_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          product_name?: string | null
          quantity?: number | null
          unit_price?: number | null
          total_price?: number | null
          created_at?: string
        }
      }
      orgs: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          clerk_user_id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          position: string | null
          avatar_url: string | null
          timezone: string
          language: string
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          clerk_user_id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          position?: string | null
          avatar_url?: string | null
          timezone?: string
          language?: string
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          position?: string | null
          avatar_url?: string | null
          timezone?: string
          language?: string
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: any
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: any
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: any
          created_at?: string
        }
      }
      user_org_memberships: {
        Row: {
          id: string
          user_id: string
          org_id: string
          role_id: string
          is_primary: boolean
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id: string
          role_id: string
          is_primary?: boolean
          joined_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string
          role_id?: string
          is_primary?: boolean
          joined_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      mv_upcoming_voyages: {
        Row: {
          id: string
          vessel_name: string | null
          voyage_no: string
          eta: string | null
          etd: string | null
          status: string
          terminal_name: string | null
          line_name: string | null
          containers_total: number
          containers_available: number
        }
      }
      mv_dwell: {
        Row: {
          cntr_no: string
          discharged_at: string | null
          picked_at: string | null
          dwell_hours: number | null
        }
      }
    }
  }
}
