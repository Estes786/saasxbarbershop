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
      user_profiles: {
        Row: {
          id: string
          email: string
          role: string
          customer_phone: string | null
          customer_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: string
          customer_phone?: string | null
          customer_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          role?: string
          customer_phone?: string | null
          customer_name?: string | null
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          customer_phone: string
          customer_name: string
          booking_date: string
          booking_time: string
          service_tier: string
          requested_capster: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_phone: string
          customer_name: string
          booking_date: string
          booking_time: string
          service_tier: string
          requested_capster?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          customer_name?: string
          booking_date?: string
          booking_time?: string
          service_tier?: string
          requested_capster?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
      }
      barbershop_transactions: {
        Row: {
          id: string
          transaction_date: string
          customer_phone: string
          customer_name: string | null
          customer_area: string | null
          service_tier: string
          upsell_items: string | null
          capster_name: string | null
          atv_amount: number
          discount_amount: number
          net_revenue: number
          is_coupon_redeemed: boolean
          is_google_review_asked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_date: string
          customer_phone: string
          customer_name?: string | null
          customer_area?: string | null
          service_tier: string
          upsell_items?: string | null
          capster_name?: string | null
          atv_amount: number
          discount_amount?: number
          is_coupon_redeemed?: boolean
          is_google_review_asked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_date?: string
          customer_phone?: string
          customer_name?: string | null
          customer_area?: string | null
          service_tier?: string
          upsell_items?: string | null
          capster_name?: string | null
          atv_amount?: number
          discount_amount?: number
          is_coupon_redeemed?: boolean
          is_google_review_asked?: boolean
          updated_at?: string
        }
      }
      barbershop_customers: {
        Row: {
          customer_phone: string
          customer_name: string
          customer_area: string | null
          total_visits: number
          total_revenue: number
          average_atv: number
          last_visit_date: string | null
          average_recency_days: number | null
          customer_segment: string | null
          lifetime_value: number
          coupon_count: number
          coupon_eligible: boolean
          google_review_given: boolean
          next_visit_prediction: string | null
          churn_risk_score: number
          first_visit_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          customer_phone: string
          customer_name: string
          customer_area?: string | null
          total_visits?: number
          total_revenue?: number
          average_atv?: number
          last_visit_date?: string | null
          average_recency_days?: number | null
          customer_segment?: string | null
          lifetime_value?: number
          coupon_count?: number
          coupon_eligible?: boolean
          google_review_given?: boolean
          next_visit_prediction?: string | null
          churn_risk_score?: number
          first_visit_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          customer_name?: string
          customer_area?: string | null
          total_visits?: number
          total_revenue?: number
          average_atv?: number
          last_visit_date?: string | null
          average_recency_days?: number | null
          customer_segment?: string | null
          lifetime_value?: number
          coupon_count?: number
          coupon_eligible?: boolean
          google_review_given?: boolean
          next_visit_prediction?: string | null
          churn_risk_score?: number
          updated_at?: string
        }
      }
      barbershop_analytics_daily: {
        Row: {
          date: string
          total_revenue: number
          total_transactions: number
          average_atv: number
          new_customers: number
          returning_customers: number
          total_unique_customers: number
          basic_tier_count: number
          premium_tier_count: number
          mastery_tier_count: number
          upsell_rate: number
          coupons_redeemed: number
          reviews_requested: number
          khl_target: number
          khl_progress: number
          month_to_date_revenue: number
          day_of_week: string | null
          is_weekend: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          date: string
          total_revenue?: number
          total_transactions?: number
          average_atv?: number
          new_customers?: number
          returning_customers?: number
          total_unique_customers?: number
          basic_tier_count?: number
          premium_tier_count?: number
          mastery_tier_count?: number
          upsell_rate?: number
          coupons_redeemed?: number
          reviews_requested?: number
          khl_target?: number
          khl_progress?: number
          month_to_date_revenue?: number
          day_of_week?: string | null
          is_weekend?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          total_revenue?: number
          total_transactions?: number
          average_atv?: number
          new_customers?: number
          returning_customers?: number
          total_unique_customers?: number
          basic_tier_count?: number
          premium_tier_count?: number
          mastery_tier_count?: number
          upsell_rate?: number
          coupons_redeemed?: number
          reviews_requested?: number
          khl_target?: number
          khl_progress?: number
          month_to_date_revenue?: number
          day_of_week?: string | null
          is_weekend?: boolean
          updated_at?: string
        }
      }
      barbershop_actionable_leads: {
        Row: {
          id: string
          customer_phone: string
          customer_name: string
          lead_segment: string
          priority: string
          recommended_action: string
          whatsapp_message_template: string | null
          days_since_last_visit: number | null
          average_atv: number | null
          total_visits: number | null
          lifetime_value: number | null
          is_contacted: boolean
          contacted_at: string | null
          contact_result: string | null
          generated_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_phone: string
          customer_name: string
          lead_segment: string
          priority: string
          recommended_action: string
          whatsapp_message_template?: string | null
          days_since_last_visit?: number | null
          average_atv?: number | null
          total_visits?: number | null
          lifetime_value?: number | null
          is_contacted?: boolean
          contacted_at?: string | null
          contact_result?: string | null
          generated_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          customer_name?: string
          lead_segment?: string
          priority?: string
          recommended_action?: string
          whatsapp_message_template?: string | null
          days_since_last_visit?: number | null
          average_atv?: number | null
          total_visits?: number | null
          lifetime_value?: number | null
          is_contacted?: boolean
          contacted_at?: string | null
          contact_result?: string | null
          expires_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_churn_risk: {
        Args: {
          p_customer_phone: string
        }
        Returns: number
      }
      get_khl_progress: {
        Args: {
          p_month?: number
          p_year?: number
        }
        Returns: {
          target_khl: number
          current_revenue: number
          progress_percentage: number
          days_in_month: number
          days_elapsed: number
          days_remaining: number
          daily_target_remaining: number
        }[]
      }
      get_service_distribution: {
        Args: {
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          service_tier: string
          total_count: number
          total_revenue: number
          avg_atv: number
          percentage: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
