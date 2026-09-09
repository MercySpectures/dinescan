export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          is_published: boolean;
          theme_color: string | null;
          table_count: number | null;
          gst_number: string | null;
          gst_rate: number | null;
          enable_gst: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          is_published?: boolean;
          theme_color?: string | null;
          table_count?: number | null;
          gst_number?: string | null;
          gst_rate?: number | null;
          enable_gst?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          is_published?: boolean;
          theme_color?: string | null;
          table_count?: number | null;
          gst_number?: string | null;
          gst_rate?: number | null;
          enable_gst?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_veg: boolean;
          is_available: boolean;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_veg?: boolean;
          is_available?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          restaurant_id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_veg?: boolean;
          is_available?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      scan_events: {
        Row: {
          id: string;
          restaurant_id: string;
          scanned_at: string;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          scanned_at?: string;
          user_agent?: string | null;
        };
        Update: {
          user_agent?: string | null;
        };
        Relationships: [];
      };
      restaurant_memberships: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          role: "manager" | "viewer" | "kitchen" | "waiter" | "cashier";
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          role: "manager" | "viewer" | "kitchen" | "waiter" | "cashier";
          created_at?: string;
        };
        Update: {
          role?: "manager" | "viewer" | "kitchen" | "waiter" | "cashier";
        };
        Relationships: [];
      };
      tables: {
        Row: {
          id: string;
          restaurant_id: string;
          table_number: string;
          capacity: number;
          status: "vacant" | "occupied" | "billing" | "reserved";
          current_order_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_number: string;
          capacity?: number;
          status?: "vacant" | "occupied" | "billing" | "reserved";
          current_order_id?: string | null;
          created_at?: string;
        };
        Update: {
          table_number?: string;
          capacity?: number;
          status?: "vacant" | "occupied" | "billing" | "reserved";
          current_order_id?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          table_code: string | null;
          session_id: string | null;
          status: "new" | "preparing" | "ready" | "served" | "cancelled";
          subtotal: number;
          service_charge: number;
          tax: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_code?: string | null;
          session_id?: string | null;
          status?: "new" | "preparing" | "ready" | "served" | "cancelled";
          subtotal?: number;
          service_charge?: number;
          tax?: number;
          total?: number;
          created_at?: string;
        };
        Update: {
          status?: "new" | "preparing" | "ready" | "served" | "cancelled";
          subtotal?: number;
          service_charge?: number;
          tax?: number;
          total?: number;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          name: string;
          price: number;
          qty: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          name: string;
          price: number;
          qty: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          qty?: number;
          note?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          plan: "free" | "starter" | "pro" | "enterprise";
          status: "active" | "trialing" | "past_due" | "canceled" | "suspended";
          billing_cycle: "monthly" | "annual";
          amount: number;
          currency: string;
          current_period_start: string;
          current_period_end: string;
          max_tables: number;
          max_menu_items: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          plan?: "free" | "starter" | "pro" | "enterprise";
          status?: "active" | "trialing" | "past_due" | "canceled" | "suspended";
          billing_cycle?: "monthly" | "annual";
          amount?: number;
          currency?: string;
          current_period_start?: string;
          current_period_end?: string;
          max_tables?: number;
          max_menu_items?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan?: "free" | "starter" | "pro" | "enterprise";
          status?: "active" | "trialing" | "past_due" | "canceled" | "suspended";
          billing_cycle?: "monthly" | "annual";
          amount?: number;
          currency?: string;
          current_period_start?: string;
          current_period_end?: string;
          max_tables?: number;
          max_menu_items?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
