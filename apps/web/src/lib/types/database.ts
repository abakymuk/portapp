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
          status: 'draft' | 'submitted' | 'in_process' | 'completed' | 'canceled'
          requested_pickup_at: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          created_by?: string | null
          order_no: string
          status?: 'draft' | 'submitted' | 'in_process' | 'completed' | 'canceled'
          requested_pickup_at?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          created_by?: string | null
          order_no?: string
          status?: 'draft' | 'submitted' | 'in_process' | 'completed' | 'canceled'
          requested_pickup_at?: string | null
          note?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          cntr_no: string
          container_id: string | null
          bill_of_lading: string | null
          service_type: 'pickup' | 'drayage' | 'yard_move' | 'storage'
          status: 'planned' | 'ready' | 'done' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          cntr_no: string
          container_id?: string | null
          bill_of_lading?: string | null
          service_type?: 'pickup' | 'drayage' | 'yard_move' | 'storage'
          status?: 'planned' | 'ready' | 'done' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          cntr_no?: string
          container_id?: string | null
          bill_of_lading?: string | null
          service_type?: 'pickup' | 'drayage' | 'yard_move' | 'storage'
          status?: 'planned' | 'ready' | 'done' | 'failed'
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
