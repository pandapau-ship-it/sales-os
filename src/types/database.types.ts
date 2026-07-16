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
  public: {
    Tables: {
      addons: {
        Row: {
          activated_at: string | null
          addon_type: string | null
          created_at: string | null
          id: string
          organization_id: string
          price: number | null
          status: string | null
        }
        Insert: {
          activated_at?: string | null
          addon_type?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          price?: number | null
          status?: string | null
        }
        Update: {
          activated_at?: string | null
          addon_type?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          price?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_type: string
          confidence_threshold: number | null
          created_at: string | null
          id: string
          is_auto_allowed: boolean
          organization_id: string
          risk_level: string
        }
        Insert: {
          action_type: string
          confidence_threshold?: number | null
          created_at?: string | null
          id?: string
          is_auto_allowed: boolean
          organization_id: string
          risk_level: string
        }
        Update: {
          action_type?: string
          confidence_threshold?: number | null
          created_at?: string | null
          id?: string
          is_auto_allowed?: boolean
          organization_id?: string
          risk_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklisted_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          approval_rules: Json | null
          automation_level: string | null
          created_at: string | null
          created_by: string | null
          exclusions: Json | null
          icp_filter: Json | null
          id: string
          intent_threshold: number | null
          lead_sources: string[] | null
          messaging_brief: Json | null
          name: string
          organization_id: string
          pitch: Json | null
          sender_config: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approval_rules?: Json | null
          automation_level?: string | null
          created_at?: string | null
          created_by?: string | null
          exclusions?: Json | null
          icp_filter?: Json | null
          id?: string
          intent_threshold?: number | null
          lead_sources?: string[] | null
          messaging_brief?: Json | null
          name: string
          organization_id: string
          pitch?: Json | null
          sender_config?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_rules?: Json | null
          automation_level?: string | null
          created_at?: string | null
          created_by?: string | null
          exclusions?: Json | null
          icp_filter?: Json | null
          id?: string
          intent_threshold?: number | null
          lead_sources?: string[] | null
          messaging_brief?: Json | null
          name?: string
          organization_id?: string
          pitch?: Json | null
          sender_config?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          langfuse_trace_id: string | null
          role: string | null
          session_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          langfuse_trace_id?: string | null
          role?: string | null
          session_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          langfuse_trace_id?: string | null
          role?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_rules: {
        Row: {
          condition: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string | null
          organization_id: string
          points: number | null
          source: string | null
        }
        Insert: {
          condition?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id: string
          points?: number | null
          source?: string | null
        }
        Update: {
          condition?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string
          points?: number | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "churn_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          channel: string
          contact_id: string
          created_at: string | null
          created_by: string | null
          direction: string
          id: string
          note: string | null
          occurred_at: string
          organization_id: string
        }
        Insert: {
          channel: string
          contact_id: string
          created_at?: string | null
          created_by?: string | null
          direction: string
          id?: string
          note?: string | null
          occurred_at?: string
          organization_id: string
        }
        Update: {
          channel?: string
          contact_id?: string
          created_at?: string | null
          created_by?: string | null
          direction?: string
          id?: string
          note?: string | null
          occurred_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          annual_revenue: number | null
          arr_yearly: number | null
          city: string | null
          country: string | null
          created_at: string | null
          crm_id: string | null
          domain: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          mrr_monthly: number | null
          mrr_source: string | null
          name: string
          notes: string | null
          organization_id: string
          size_range: string | null
          subscription_plan: string | null
          subscription_since: string | null
          subscription_status: string | null
          tags: string[] | null
          tech_stack: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          arr_yearly?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          crm_id?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          mrr_monthly?: number | null
          mrr_source?: string | null
          name: string
          notes?: string | null
          organization_id: string
          size_range?: string | null
          subscription_plan?: string | null
          subscription_since?: string | null
          subscription_status?: string | null
          tags?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          arr_yearly?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          crm_id?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          mrr_monthly?: number | null
          mrr_source?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          size_range?: string | null
          subscription_plan?: string | null
          subscription_since?: string | null
          subscription_status?: string | null
          tags?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_phones: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          label: string | null
          number: string
          organization_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          number: string
          organization_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          number?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_phones_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_phones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_to: string | null
          automation_override: string | null
          churn_score: number | null
          company_id: string | null
          contact_status: string | null
          created_at: string | null
          created_by: string | null
          data_sources: string[] | null
          department: string | null
          email: string | null
          email_suggestion: string | null
          email_verification_date: string | null
          email_verification_source: string | null
          email_verification_status: string | null
          email_verified: boolean | null
          enrichment_sources: string[] | null
          first_name: string | null
          health_score: number | null
          health_status: string | null
          heat_status: string | null
          icp_score: number | null
          id: string
          job_title: string | null
          language: string | null
          last_contacted_at: string | null
          last_name: string | null
          last_reply_at: string | null
          lead_source: string | null
          lead_status: string | null
          linkedin_url: string | null
          notes: string | null
          opt_out_at: string | null
          opt_out_reason: string | null
          organization_id: string
          personality_confidence: number | null
          personality_profile: Json | null
          personality_sources: string[] | null
          personality_updated_at: string | null
          primary_company_id: string | null
          salutation: string | null
          score_drivers: Json | null
          seniority: string | null
          sherloq_contact_id: string | null
          tags: string[] | null
          twitter_handle: string | null
          updated_at: string | null
          upsell_drivers: Json | null
          upsell_score: number | null
        }
        Insert: {
          assigned_to?: string | null
          automation_override?: string | null
          churn_score?: number | null
          company_id?: string | null
          contact_status?: string | null
          created_at?: string | null
          created_by?: string | null
          data_sources?: string[] | null
          department?: string | null
          email?: string | null
          email_suggestion?: string | null
          email_verification_date?: string | null
          email_verification_source?: string | null
          email_verification_status?: string | null
          email_verified?: boolean | null
          enrichment_sources?: string[] | null
          first_name?: string | null
          health_score?: number | null
          health_status?: string | null
          heat_status?: string | null
          icp_score?: number | null
          id?: string
          job_title?: string | null
          language?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          last_reply_at?: string | null
          lead_source?: string | null
          lead_status?: string | null
          linkedin_url?: string | null
          notes?: string | null
          opt_out_at?: string | null
          opt_out_reason?: string | null
          organization_id: string
          personality_confidence?: number | null
          personality_profile?: Json | null
          personality_sources?: string[] | null
          personality_updated_at?: string | null
          primary_company_id?: string | null
          salutation?: string | null
          score_drivers?: Json | null
          seniority?: string | null
          sherloq_contact_id?: string | null
          tags?: string[] | null
          twitter_handle?: string | null
          updated_at?: string | null
          upsell_drivers?: Json | null
          upsell_score?: number | null
        }
        Update: {
          assigned_to?: string | null
          automation_override?: string | null
          churn_score?: number | null
          company_id?: string | null
          contact_status?: string | null
          created_at?: string | null
          created_by?: string | null
          data_sources?: string[] | null
          department?: string | null
          email?: string | null
          email_suggestion?: string | null
          email_verification_date?: string | null
          email_verification_source?: string | null
          email_verification_status?: string | null
          email_verified?: boolean | null
          enrichment_sources?: string[] | null
          first_name?: string | null
          health_score?: number | null
          health_status?: string | null
          heat_status?: string | null
          icp_score?: number | null
          id?: string
          job_title?: string | null
          language?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          last_reply_at?: string | null
          lead_source?: string | null
          lead_status?: string | null
          linkedin_url?: string | null
          notes?: string | null
          opt_out_at?: string | null
          opt_out_reason?: string | null
          organization_id?: string
          personality_confidence?: number | null
          personality_profile?: Json | null
          personality_sources?: string[] | null
          personality_updated_at?: string | null
          primary_company_id?: string | null
          salutation?: string | null
          score_drivers?: Json | null
          seniority?: string | null
          sherloq_contact_id?: string | null
          tags?: string[] | null
          twitter_handle?: string | null
          updated_at?: string | null
          upsell_drivers?: Json | null
          upsell_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_primary_company_id_fkey"
            columns: ["primary_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_balance: {
        Row: {
          created_at: string | null
          credit_type: string | null
          id: string
          included_monthly: number | null
          organization_id: string
          purchased: number | null
          resets_at: string | null
          used_this_period: number | null
        }
        Insert: {
          created_at?: string | null
          credit_type?: string | null
          id?: string
          included_monthly?: number | null
          organization_id: string
          purchased?: number | null
          resets_at?: string | null
          used_this_period?: number | null
        }
        Update: {
          created_at?: string | null
          credit_type?: string | null
          id?: string
          included_monthly?: number | null
          organization_id?: string
          purchased?: number | null
          resets_at?: string | null
          used_this_period?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_balance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          credit_type: string | null
          id: string
          organization_id: string
          reason: string | null
          reference_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          credit_type?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          reference_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          credit_type?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_dashboards: {
        Row: {
          created_at: string | null
          id: string
          is_shared: boolean | null
          layout: Json | null
          name: string | null
          organization_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_shared?: boolean | null
          layout?: Json | null
          name?: string | null
          organization_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_shared?: boolean | null
          layout?: Json | null
          name?: string | null
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_dashboards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_dashboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefings: {
        Row: {
          generated_at: string | null
          id: string
          organization_id: string
          priorities: Json | null
          user_id: string | null
        }
        Insert: {
          generated_at?: string | null
          id?: string
          organization_id: string
          priorities?: Json | null
          user_id?: string | null
        }
        Update: {
          generated_at?: string | null
          id?: string
          organization_id?: string
          priorities?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_briefings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_briefings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          closed_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          end_date: string | null
          expected_close_date: string | null
          heat_status: string | null
          id: string
          lost_note: string | null
          lost_reason: string | null
          meeting_prep: Json | null
          name: string
          next_action: string | null
          next_action_due_at: string | null
          notice_period_days: number | null
          organization_id: string
          owner_id: string | null
          probability: number | null
          product: string | null
          source_lead_id: string | null
          stage: string | null
          stage_updated_at: string | null
          stagnation_days: number | null
          term_months: number | null
          updated_at: string | null
          value: number | null
          won_note: string | null
          won_reason: string | null
        }
        Insert: {
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          end_date?: string | null
          expected_close_date?: string | null
          heat_status?: string | null
          id?: string
          lost_note?: string | null
          lost_reason?: string | null
          meeting_prep?: Json | null
          name: string
          next_action?: string | null
          next_action_due_at?: string | null
          notice_period_days?: number | null
          organization_id: string
          owner_id?: string | null
          probability?: number | null
          product?: string | null
          source_lead_id?: string | null
          stage?: string | null
          stage_updated_at?: string | null
          stagnation_days?: number | null
          term_months?: number | null
          updated_at?: string | null
          value?: number | null
          won_note?: string | null
          won_reason?: string | null
        }
        Update: {
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          end_date?: string | null
          expected_close_date?: string | null
          heat_status?: string | null
          id?: string
          lost_note?: string | null
          lost_reason?: string | null
          meeting_prep?: Json | null
          name?: string
          next_action?: string | null
          next_action_due_at?: string | null
          notice_period_days?: number | null
          organization_id?: string
          owner_id?: string | null
          probability?: number | null
          product?: string | null
          source_lead_id?: string | null
          stage?: string | null
          stage_updated_at?: string | null
          stagnation_days?: number | null
          term_months?: number | null
          updated_at?: string | null
          value?: number | null
          won_note?: string | null
          won_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string | null
          created_by: string | null
          filename: string | null
          id: string
          organization_id: string
          rows_created: number | null
          rows_failed: number | null
          rows_skipped: number | null
          rows_updated: number | null
          source: string | null
          status: string | null
          template_id: string | null
          undo_until: string | null
          undone_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          filename?: string | null
          id?: string
          organization_id: string
          rows_created?: number | null
          rows_failed?: number | null
          rows_skipped?: number | null
          rows_updated?: number | null
          source?: string | null
          status?: string | null
          template_id?: string | null
          undo_until?: string | null
          undone_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          filename?: string | null
          id?: string
          organization_id?: string
          rows_created?: number | null
          rows_failed?: number | null
          rows_skipped?: number | null
          rows_updated?: number | null
          source?: string | null
          status?: string | null
          template_id?: string | null
          undo_until?: string | null
          undone_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "import_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      import_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          mapping: Json
          name: string
          organization_id: string
          source_signature: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mapping?: Json
          name: string
          organization_id: string
          source_signature?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mapping?: Json
          name?: string
          organization_id?: string
          source_signature?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          created_at: string | null
          feature: string
          how: string
          id: string
          module: string | null
          organization_id: string
          value: string | null
          what: string
        }
        Insert: {
          created_at?: string | null
          feature: string
          how: string
          id?: string
          module?: string | null
          organization_id: string
          value?: string | null
          what: string
        }
        Update: {
          created_at?: string | null
          feature?: string
          how?: string
          id?: string
          module?: string | null
          organization_id?: string
          value?: string | null
          what?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_adjustments: Json | null
          campaign_id: string | null
          click_count: number | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          id: string
          intent_confidence: number | null
          intent_label: string | null
          last_open_at: string | null
          last_reply_at: string | null
          last_step_sent_at: string | null
          open_count: number | null
          organization_id: string
          pipeline_stage: string | null
          requires_human_reason: string | null
          scheduled_at: string | null
          sequence_id: string | null
          sequence_status: string | null
          sequence_step_current: number | null
          sherloq_signal_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_adjustments?: Json | null
          campaign_id?: string | null
          click_count?: number | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          intent_confidence?: number | null
          intent_label?: string | null
          last_open_at?: string | null
          last_reply_at?: string | null
          last_step_sent_at?: string | null
          open_count?: number | null
          organization_id: string
          pipeline_stage?: string | null
          requires_human_reason?: string | null
          scheduled_at?: string | null
          sequence_id?: string | null
          sequence_status?: string | null
          sequence_step_current?: number | null
          sherloq_signal_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_adjustments?: Json | null
          campaign_id?: string | null
          click_count?: number | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          intent_confidence?: number | null
          intent_label?: string | null
          last_open_at?: string | null
          last_reply_at?: string | null
          last_step_sent_at?: string | null
          open_count?: number | null
          organization_id?: string
          pipeline_stage?: string | null
          requires_human_reason?: string | null
          scheduled_at?: string | null
          sequence_id?: string | null
          sequence_status?: string | null
          sequence_step_current?: number | null
          sherloq_signal_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_deal"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leads_signal"
            columns: ["sherloq_signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      list_members: {
        Row: {
          added_at: string | null
          contact_id: string
          id: string
          list_id: string
          organization_id: string
        }
        Insert: {
          added_at?: string | null
          contact_id: string
          id?: string
          list_id: string
          organization_id: string
        }
        Update: {
          added_at?: string | null
          contact_id?: string
          id?: string
          list_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string | null
          created_by: string | null
          filter_config: Json | null
          id: string
          is_team_list: boolean | null
          name: string
          organization_id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          filter_config?: Json | null
          id?: string
          is_team_list?: boolean | null
          name: string
          organization_id: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          filter_config?: Json | null
          id?: string
          is_team_list?: boolean | null
          name?: string
          organization_id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mailboxes: {
        Row: {
          bounce_rate: number | null
          created_at: string | null
          current_daily_limit: number | null
          email_address: string | null
          id: string
          organization_id: string
          provider: string | null
          spam_rate: number | null
          status: string | null
          warmup_phase: number | null
        }
        Insert: {
          bounce_rate?: number | null
          created_at?: string | null
          current_daily_limit?: number | null
          email_address?: string | null
          id?: string
          organization_id: string
          provider?: string | null
          spam_rate?: number | null
          status?: string | null
          warmup_phase?: number | null
        }
        Update: {
          bounce_rate?: number | null
          created_at?: string | null
          current_daily_limit?: number | null
          email_address?: string | null
          id?: string
          organization_id?: string
          provider?: string | null
          spam_rate?: number | null
          status?: string | null
          warmup_phase?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mailboxes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          approved_by: string | null
          body: string
          body_html: string | null
          bounce_reason: string | null
          bounce_type: string | null
          channel: string
          clicked_at: string | null
          contact_id: string | null
          created_at: string | null
          direction: string
          error_message: string | null
          generated_by: string | null
          id: string
          lead_id: string | null
          opened_at: string | null
          organization_id: string
          provider_message_id: string | null
          replied_at: string | null
          sent_at: string | null
          sequence_step: number | null
          status: string | null
          subject: string | null
        }
        Insert: {
          approved_by?: string | null
          body: string
          body_html?: string | null
          bounce_reason?: string | null
          bounce_type?: string | null
          channel: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          direction: string
          error_message?: string | null
          generated_by?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          organization_id: string
          provider_message_id?: string | null
          replied_at?: string | null
          sent_at?: string | null
          sequence_step?: number | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          approved_by?: string | null
          body?: string
          body_html?: string | null
          bounce_reason?: string | null
          bounce_type?: string | null
          channel?: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          direction?: string
          error_message?: string | null
          generated_by?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          organization_id?: string
          provider_message_id?: string | null
          replied_at?: string | null
          sent_at?: string | null
          sequence_step?: number | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          company_id: string | null
          contact_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          deleted_at: string | null
          id: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          id?: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          id?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscription: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          organization_id: string
          plan_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          organization_id: string
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          organization_id?: string
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscription_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscription_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          branding: Json | null
          created_at: string | null
          id: string
          name: string
          plan: string | null
          settings: Json | null
          slug: string
        }
        Insert: {
          branding?: Json | null
          created_at?: string | null
          id?: string
          name: string
          plan?: string | null
          settings?: Json | null
          slug: string
        }
        Update: {
          branding?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          plan?: string | null
          settings?: Json | null
          slug?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          created_at: string | null
          feature: string | null
          id: string
          limit_value: number | null
          plan_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature?: string | null
          id?: string
          limit_value?: number | null
          plan_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature?: string | null
          id?: string
          limit_value?: number | null
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          base_seats: number | null
          created_at: string | null
          extra_seat_price: number | null
          id: string
          name: string | null
          price_monthly: number | null
          price_yearly: number | null
          stripe_price_id: string | null
        }
        Insert: {
          base_seats?: number | null
          created_at?: string | null
          extra_seat_price?: number | null
          id?: string
          name?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          stripe_price_id?: string | null
        }
        Update: {
          base_seats?: number | null
          created_at?: string | null
          extra_seat_price?: number | null
          id?: string
          name?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_tasks: {
        Row: {
          created_at: string | null
          cron_expression: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          organization_id: string
          output_channel: string[] | null
          prompt: string | null
          task_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          cron_expression?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id: string
          output_channel?: string[] | null
          prompt?: string | null
          task_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          cron_expression?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id?: string
          output_channel?: string[] | null
          prompt?: string | null
          task_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_rules: {
        Row: {
          action: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          organization_id: string
          trigger_signal: string | null
        }
        Insert: {
          action?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id: string
          trigger_signal?: string | null
        }
        Update: {
          action?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string
          trigger_signal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          followup_delay_days: number | null
          id: string
          max_steps: number | null
          name: string | null
          organization_id: string
          reactivation_days: number | null
          steps: Json
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          followup_delay_days?: number | null
          id?: string
          max_steps?: number | null
          name?: string | null
          organization_id: string
          reactivation_days?: number | null
          steps: Json
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          followup_delay_days?: number | null
          id?: string
          max_steps?: number | null
          name?: string | null
          organization_id?: string
          reactivation_days?: number | null
          steps?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          automation_defaults: Json | null
          created_at: string | null
          id: string
          lead_assignment_strategy: string | null
          modules: Json | null
          organization_id: string
          pipeline_stages: Json | null
          sending_defaults: Json | null
          signal_windows: Json | null
          thresholds: Json | null
          updated_at: string | null
        }
        Insert: {
          automation_defaults?: Json | null
          created_at?: string | null
          id?: string
          lead_assignment_strategy?: string | null
          modules?: Json | null
          organization_id: string
          pipeline_stages?: Json | null
          sending_defaults?: Json | null
          signal_windows?: Json | null
          thresholds?: Json | null
          updated_at?: string | null
        }
        Update: {
          automation_defaults?: Json | null
          created_at?: string | null
          id?: string
          lead_assignment_strategy?: string | null
          modules?: Json | null
          organization_id?: string
          pipeline_stages?: Json | null
          sending_defaults?: Json | null
          signal_windows?: Json | null
          thresholds?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          organization_id: string
          processed_at: string | null
          routed_to: string | null
          sherloq_contact_id: string | null
          sherloq_signal_id: string | null
          signal_data: Json | null
          signal_type: string
          source: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          processed_at?: string | null
          routed_to?: string | null
          sherloq_contact_id?: string | null
          sherloq_signal_id?: string | null
          signal_data?: Json | null
          signal_type: string
          source?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          processed_at?: string | null
          routed_to?: string | null
          sherloq_contact_id?: string | null
          sherloq_signal_id?: string | null
          signal_data?: Json | null
          signal_type?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          channel: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          deleted_at: string | null
          description: string | null
          due_at: string | null
          id: string
          organization_id: string
          priority: string | null
          source: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          organization_id: string
          priority?: string | null
          source?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          organization_id?: string
          priority?: string | null
          source?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_rules: {
        Row: {
          condition: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string | null
          organization_id: string
          points: number | null
          source: string | null
        }
        Insert: {
          condition?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id: string
          points?: number | null
          source?: string | null
        }
        Update: {
          condition?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string
          points?: number | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upsell_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          organization_id: string
          permission: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          organization_id: string
          permission?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          organization_id?: string
          permission?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_seen_at: string | null
          organization_id: string
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          organization_id: string
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          organization_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_org_id: { Args: never; Returns: string }
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
