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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          criteria: Json
          description: string | null
          icon_name: string | null
          id: string
          name: string
          points_bonus: number | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          criteria: Json
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          points_bonus?: number | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          criteria?: Json
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          points_bonus?: number | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_category: string
          activity_type: string
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          device_info: Json | null
          id: string
          impact_level: string | null
          points: number | null
          scheduled_for: string | null
          status: string | null
          transcription: string | null
          user_id: string
          voice_note_url: string | null
        }
        Insert: {
          activity_category: string
          activity_type: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          device_info?: Json | null
          id?: string
          impact_level?: string | null
          points?: number | null
          scheduled_for?: string | null
          status?: string | null
          transcription?: string | null
          user_id: string
          voice_note_url?: string | null
        }
        Update: {
          activity_category?: string
          activity_type?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          device_info?: Json | null
          id?: string
          impact_level?: string | null
          points?: number | null
          scheduled_for?: string | null
          status?: string | null
          transcription?: string | null
          user_id?: string
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      ce_module_completions: {
        Row: {
          attempts: number | null
          certificate_number: string | null
          certificate_url: string | null
          completed_at: string | null
          created_at: string | null
          device_info: Json | null
          id: string
          ip_address: unknown
          module_id: string
          quiz_answers: Json | null
          quiz_passed: boolean | null
          quiz_score: number | null
          started_at: string | null
          time_spent: number | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          certificate_number?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          module_id: string
          quiz_answers?: Json | null
          quiz_passed?: boolean | null
          quiz_score?: number | null
          started_at?: string | null
          time_spent?: number | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          certificate_number?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          module_id?: string
          quiz_answers?: Json | null
          quiz_passed?: boolean | null
          quiz_score?: number | null
          started_at?: string | null
          time_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ce_module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "continuing_education_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      celebration_comments: {
        Row: {
          celebration_id: string
          comment: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          celebration_id: string
          comment: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          celebration_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebration_comments_celebration_id_fkey"
            columns: ["celebration_id"]
            isOneToOne: false
            referencedRelation: "celebration_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      celebration_feed: {
        Row: {
          achievement_id: string | null
          celebration_type: string
          comment_count: number | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          like_count: number | null
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          achievement_id?: string | null
          celebration_type: string
          comment_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          achievement_id?: string | null
          celebration_type?: string
          comment_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebration_feed_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      celebration_likes: {
        Row: {
          celebration_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          celebration_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          celebration_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebration_likes_celebration_id_fkey"
            columns: ["celebration_id"]
            isOneToOne: false
            referencedRelation: "celebration_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      ceo_messages: {
        Row: {
          avg_watch_percentage: number | null
          comment_count: number | null
          comment_points: number | null
          content: string | null
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          message_type: string
          published_at: string | null
          react_points: number | null
          reaction_count: number | null
          target_roles: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_duration: number | null
          video_url: string | null
          view_count: number | null
          view_points: number | null
          watch_80_percent_points: number | null
        }
        Insert: {
          avg_watch_percentage?: number | null
          comment_count?: number | null
          comment_points?: number | null
          content?: string | null
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type: string
          published_at?: string | null
          react_points?: number | null
          reaction_count?: number | null
          target_roles?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
          view_count?: number | null
          view_points?: number | null
          watch_80_percent_points?: number | null
        }
        Update: {
          avg_watch_percentage?: number | null
          comment_count?: number | null
          comment_points?: number | null
          content?: string | null
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: string
          published_at?: string | null
          react_points?: number | null
          reaction_count?: number | null
          target_roles?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
          view_count?: number | null
          view_points?: number | null
          watch_80_percent_points?: number | null
        }
        Relationships: []
      }
      coaching_notes: {
        Row: {
          action_items: Json | null
          coach_id: string
          content: string
          created_at: string | null
          follow_up_completed: boolean | null
          follow_up_date: string | null
          id: string
          is_private: boolean | null
          loan_officer_id: string
          note_type: string
          requires_follow_up: boolean | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          coach_id: string
          content: string
          created_at?: string | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          id?: string
          is_private?: boolean | null
          loan_officer_id: string
          note_type: string
          requires_follow_up?: boolean | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          coach_id?: string
          content?: string
          created_at?: string | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          id?: string
          is_private?: boolean | null
          loan_officer_id?: string
          note_type?: string
          requires_follow_up?: boolean | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          contact_type: string
          created_at: string | null
          days_since_contact: number | null
          email: string | null
          health_score: number | null
          health_status: string | null
          id: string
          last_contact_date: string | null
          last_contact_type: string | null
          loans_closed: number | null
          name: string
          notes: string | null
          phone: string | null
          referrals_received: number | null
          tags: string[] | null
          title: string | null
          total_touches: number | null
          total_volume: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          contact_type: string
          created_at?: string | null
          days_since_contact?: number | null
          email?: string | null
          health_score?: number | null
          health_status?: string | null
          id?: string
          last_contact_date?: string | null
          last_contact_type?: string | null
          loans_closed?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          referrals_received?: number | null
          tags?: string[] | null
          title?: string | null
          total_touches?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          contact_type?: string
          created_at?: string | null
          days_since_contact?: number | null
          email?: string | null
          health_score?: number | null
          health_status?: string | null
          id?: string
          last_contact_date?: string | null
          last_contact_type?: string | null
          loans_closed?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          referrals_received?: number | null
          tags?: string[] | null
          title?: string | null
          total_touches?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      continuing_education_modules: {
        Row: {
          avg_score: number | null
          category: string
          completion_count: number | null
          content_type: string
          content_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          has_quiz: boolean | null
          id: string
          is_nmls_required: boolean | null
          module_name: string
          module_type: string
          nmls_course_id: string | null
          pass_threshold: number | null
          published_at: string | null
          quiz_questions: Json | null
          recurrence: string | null
          reminder_days: number[] | null
          status: string | null
          updated_at: string | null
          video_duration: number | null
        }
        Insert: {
          avg_score?: number | null
          category: string
          completion_count?: number | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          has_quiz?: boolean | null
          id?: string
          is_nmls_required?: boolean | null
          module_name: string
          module_type: string
          nmls_course_id?: string | null
          pass_threshold?: number | null
          published_at?: string | null
          quiz_questions?: Json | null
          recurrence?: string | null
          reminder_days?: number[] | null
          status?: string | null
          updated_at?: string | null
          video_duration?: number | null
        }
        Update: {
          avg_score?: number | null
          category?: string
          completion_count?: number | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          has_quiz?: boolean | null
          id?: string
          is_nmls_required?: boolean | null
          module_name?: string
          module_type?: string
          nmls_course_id?: string | null
          pass_threshold?: number | null
          published_at?: string | null
          quiz_questions?: Json | null
          recurrence?: string | null
          reminder_days?: number[] | null
          status?: string | null
          updated_at?: string | null
          video_duration?: number | null
        }
        Relationships: []
      }
      daily_power_moves: {
        Row: {
          assigned_date: string
          capacity_level: string | null
          completion_percentage: number | null
          created_at: string | null
          daily_grade: string | null
          id: string
          move_1_activity_id: string | null
          move_1_completed: boolean | null
          move_1_completed_at: string | null
          move_1_contact_id: string | null
          move_1_description: string
          move_1_points: number | null
          move_2_activity_id: string | null
          move_2_completed: boolean | null
          move_2_completed_at: string | null
          move_2_contact_id: string | null
          move_2_description: string
          move_2_points: number | null
          move_3_activity_id: string | null
          move_3_completed: boolean | null
          move_3_completed_at: string | null
          move_3_contact_id: string | null
          move_3_description: string
          move_3_points: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_date: string
          capacity_level?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          daily_grade?: string | null
          id?: string
          move_1_activity_id?: string | null
          move_1_completed?: boolean | null
          move_1_completed_at?: string | null
          move_1_contact_id?: string | null
          move_1_description: string
          move_1_points?: number | null
          move_2_activity_id?: string | null
          move_2_completed?: boolean | null
          move_2_completed_at?: string | null
          move_2_contact_id?: string | null
          move_2_description: string
          move_2_points?: number | null
          move_3_activity_id?: string | null
          move_3_completed?: boolean | null
          move_3_completed_at?: string | null
          move_3_contact_id?: string | null
          move_3_description: string
          move_3_points?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_date?: string
          capacity_level?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          daily_grade?: string | null
          id?: string
          move_1_activity_id?: string | null
          move_1_completed?: boolean | null
          move_1_completed_at?: string | null
          move_1_contact_id?: string | null
          move_1_description?: string
          move_1_points?: number | null
          move_2_activity_id?: string | null
          move_2_completed?: boolean | null
          move_2_completed_at?: string | null
          move_2_contact_id?: string | null
          move_2_description?: string
          move_2_points?: number | null
          move_3_activity_id?: string | null
          move_3_completed?: boolean | null
          move_3_completed_at?: string | null
          move_3_contact_id?: string | null
          move_3_description?: string
          move_3_points?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_power_moves_move_1_activity_id_fkey"
            columns: ["move_1_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_power_moves_move_1_contact_id_fkey"
            columns: ["move_1_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_power_moves_move_2_activity_id_fkey"
            columns: ["move_2_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_power_moves_move_2_contact_id_fkey"
            columns: ["move_2_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_power_moves_move_3_activity_id_fkey"
            columns: ["move_3_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_power_moves_move_3_contact_id_fkey"
            columns: ["move_3_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_data: {
        Row: {
          activities_logged: number | null
          calculated_at: string | null
          completion_percentage: number | null
          id: string
          loans_closed: number | null
          period_end: string
          period_start: string
          period_type: string
          rank_by_loans: number | null
          rank_by_points: number | null
          rank_by_volume: number | null
          tier: string | null
          total_points: number | null
          user_id: string
          volume_closed: number | null
        }
        Insert: {
          activities_logged?: number | null
          calculated_at?: string | null
          completion_percentage?: number | null
          id?: string
          loans_closed?: number | null
          period_end: string
          period_start: string
          period_type: string
          rank_by_loans?: number | null
          rank_by_points?: number | null
          rank_by_volume?: number | null
          tier?: string | null
          total_points?: number | null
          user_id: string
          volume_closed?: number | null
        }
        Update: {
          activities_logged?: number | null
          calculated_at?: string | null
          completion_percentage?: number | null
          id?: string
          loans_closed?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          rank_by_loans?: number | null
          rank_by_points?: number | null
          rank_by_volume?: number | null
          tier?: string | null
          total_points?: number | null
          user_id?: string
          volume_closed?: number | null
        }
        Relationships: []
      }
      licenses: {
        Row: {
          created_at: string | null
          expiry_date: string
          id: string
          issue_date: string | null
          license_document_url: string | null
          license_type: string | null
          nmls_number: string
          reminder_30_sent: boolean | null
          reminder_60_sent: boolean | null
          reminder_90_sent: boolean | null
          renewal_in_progress: boolean | null
          renewal_notes: string | null
          renewal_submitted_date: string | null
          state: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expiry_date: string
          id?: string
          issue_date?: string | null
          license_document_url?: string | null
          license_type?: string | null
          nmls_number: string
          reminder_30_sent?: boolean | null
          reminder_60_sent?: boolean | null
          reminder_90_sent?: boolean | null
          renewal_in_progress?: boolean | null
          renewal_notes?: string | null
          renewal_submitted_date?: string | null
          state: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string | null
          license_document_url?: string | null
          license_type?: string | null
          nmls_number?: string
          reminder_30_sent?: boolean | null
          reminder_60_sent?: boolean | null
          reminder_90_sent?: boolean | null
          renewal_in_progress?: boolean | null
          renewal_notes?: string | null
          renewal_submitted_date?: string | null
          state?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_views: {
        Row: {
          comment_text: string | null
          commented: boolean | null
          completed_80_percent: boolean | null
          created_at: string | null
          device_info: Json | null
          id: string
          message_id: string
          points_earned: number | null
          reacted: boolean | null
          reaction_type: string | null
          user_id: string
          viewed_at: string | null
          watch_duration: number | null
          watch_percentage: number | null
        }
        Insert: {
          comment_text?: string | null
          commented?: boolean | null
          completed_80_percent?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          message_id: string
          points_earned?: number | null
          reacted?: boolean | null
          reaction_type?: string | null
          user_id: string
          viewed_at?: string | null
          watch_duration?: number | null
          watch_percentage?: number | null
        }
        Update: {
          comment_text?: string | null
          commented?: boolean | null
          completed_80_percent?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          message_id?: string
          points_earned?: number | null
          reacted?: boolean | null
          reaction_type?: string | null
          user_id?: string
          viewed_at?: string | null
          watch_duration?: number | null
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_views_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ceo_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      pip_records: {
        Row: {
          action_plan: string | null
          actual_end_date: string | null
          admin_override: boolean | null
          created_at: string | null
          current_status: string | null
          expected_end_date: string | null
          id: string
          outcome: string | null
          outcome_notes: string | null
          override_at: string | null
          override_by: string | null
          override_reason: string | null
          pip_stage: string
          progress_notes: string | null
          started_at: string
          success_criteria: Json | null
          trigger_reason: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_plan?: string | null
          actual_end_date?: string | null
          admin_override?: boolean | null
          created_at?: string | null
          current_status?: string | null
          expected_end_date?: string | null
          id?: string
          outcome?: string | null
          outcome_notes?: string | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          pip_stage: string
          progress_notes?: string | null
          started_at: string
          success_criteria?: Json | null
          trigger_reason: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_plan?: string | null
          actual_end_date?: string | null
          admin_override?: boolean | null
          created_at?: string | null
          current_status?: string | null
          expected_end_date?: string | null
          id?: string
          outcome?: string | null
          outcome_notes?: string | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          pip_stage?: string
          progress_notes?: string | null
          started_at?: string
          success_criteria?: Json | null
          trigger_reason?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          acknowledgment_count: number | null
          affects_capital_markets: boolean | null
          affects_closing: boolean | null
          affects_compliance: boolean | null
          affects_disclosures: boolean | null
          affects_funding: boolean | null
          affects_lock_desk: boolean | null
          affects_marketing: boolean | null
          affects_opening: boolean | null
          affects_processing: boolean | null
          affects_qc: boolean | null
          affects_sales: boolean | null
          affects_setup: boolean | null
          affects_technology: boolean | null
          affects_underwriting: boolean | null
          approval_date: string | null
          approved_by: string | null
          avg_quiz_score: number | null
          compliance_source: string | null
          created_at: string | null
          created_by: string
          effective_date: string | null
          has_quiz: boolean | null
          id: string
          parent_policy_id: string | null
          pass_threshold: number | null
          policy_content: string
          policy_name: string
          policy_type: string
          published_at: string | null
          quiz_questions: Json | null
          rejection_reason: string | null
          review_frequency: string | null
          status: string | null
          supporting_documents: string[] | null
          updated_at: string | null
          urgency_level: string | null
          version: number | null
          view_count: number | null
        }
        Insert: {
          acknowledgment_count?: number | null
          affects_capital_markets?: boolean | null
          affects_closing?: boolean | null
          affects_compliance?: boolean | null
          affects_disclosures?: boolean | null
          affects_funding?: boolean | null
          affects_lock_desk?: boolean | null
          affects_marketing?: boolean | null
          affects_opening?: boolean | null
          affects_processing?: boolean | null
          affects_qc?: boolean | null
          affects_sales?: boolean | null
          affects_setup?: boolean | null
          affects_technology?: boolean | null
          affects_underwriting?: boolean | null
          approval_date?: string | null
          approved_by?: string | null
          avg_quiz_score?: number | null
          compliance_source?: string | null
          created_at?: string | null
          created_by: string
          effective_date?: string | null
          has_quiz?: boolean | null
          id?: string
          parent_policy_id?: string | null
          pass_threshold?: number | null
          policy_content: string
          policy_name: string
          policy_type: string
          published_at?: string | null
          quiz_questions?: Json | null
          rejection_reason?: string | null
          review_frequency?: string | null
          status?: string | null
          supporting_documents?: string[] | null
          updated_at?: string | null
          urgency_level?: string | null
          version?: number | null
          view_count?: number | null
        }
        Update: {
          acknowledgment_count?: number | null
          affects_capital_markets?: boolean | null
          affects_closing?: boolean | null
          affects_compliance?: boolean | null
          affects_disclosures?: boolean | null
          affects_funding?: boolean | null
          affects_lock_desk?: boolean | null
          affects_marketing?: boolean | null
          affects_opening?: boolean | null
          affects_processing?: boolean | null
          affects_qc?: boolean | null
          affects_sales?: boolean | null
          affects_setup?: boolean | null
          affects_technology?: boolean | null
          affects_underwriting?: boolean | null
          approval_date?: string | null
          approved_by?: string | null
          avg_quiz_score?: number | null
          compliance_source?: string | null
          created_at?: string | null
          created_by?: string
          effective_date?: string | null
          has_quiz?: boolean | null
          id?: string
          parent_policy_id?: string | null
          pass_threshold?: number | null
          policy_content?: string
          policy_name?: string
          policy_type?: string
          published_at?: string | null
          quiz_questions?: Json | null
          rejection_reason?: string | null
          review_frequency?: string | null
          status?: string | null
          supporting_documents?: string[] | null
          updated_at?: string | null
          urgency_level?: string | null
          version?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_parent_policy_id_fkey"
            columns: ["parent_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          acknowledged_device: string | null
          acknowledged_ip: unknown
          clarification_requested: string | null
          created_at: string | null
          device_info: Json | null
          digital_signature: string | null
          flagged_not_understood: boolean | null
          id: string
          ip_address: unknown
          policy_id: string
          quiz_answers: Json | null
          quiz_attempts: number | null
          quiz_passed: boolean | null
          quiz_score: number | null
          quiz_taken: boolean | null
          read_duration: number | null
          time_to_acknowledge: number | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_device?: string | null
          acknowledged_ip?: unknown
          clarification_requested?: string | null
          created_at?: string | null
          device_info?: Json | null
          digital_signature?: string | null
          flagged_not_understood?: boolean | null
          id?: string
          ip_address?: unknown
          policy_id: string
          quiz_answers?: Json | null
          quiz_attempts?: number | null
          quiz_passed?: boolean | null
          quiz_score?: number | null
          quiz_taken?: boolean | null
          read_duration?: number | null
          time_to_acknowledge?: number | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_device?: string | null
          acknowledged_ip?: unknown
          clarification_requested?: string | null
          created_at?: string | null
          device_info?: Json | null
          digital_signature?: string | null
          flagged_not_understood?: boolean | null
          id?: string
          ip_address?: unknown
          policy_id?: string
          quiz_answers?: Json | null
          quiz_attempts?: number | null
          quiz_passed?: boolean | null
          quiz_score?: number | null
          quiz_taken?: boolean | null
          read_duration?: number | null
          time_to_acknowledge?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_acknowledgments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          daily_completion_avg: number | null
          email: string | null
          favorite_programs: string[] | null
          full_name: string | null
          id: string
          last_activity_date: string | null
          license_expiry_date: string | null
          license_status: string | null
          longest_streak: number | null
          momentum_score: number | null
          nmls_number: string | null
          phone: string | null
          pip_reason: string | null
          pip_start_date: string | null
          pip_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          daily_completion_avg?: number | null
          email?: string | null
          favorite_programs?: string[] | null
          full_name?: string | null
          id?: string
          last_activity_date?: string | null
          license_expiry_date?: string | null
          license_status?: string | null
          longest_streak?: number | null
          momentum_score?: number | null
          nmls_number?: string | null
          phone?: string | null
          pip_reason?: string | null
          pip_start_date?: string | null
          pip_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          daily_completion_avg?: number | null
          email?: string | null
          favorite_programs?: string[] | null
          full_name?: string | null
          id?: string
          last_activity_date?: string | null
          license_expiry_date?: string | null
          license_status?: string | null
          longest_streak?: number | null
          momentum_score?: number | null
          nmls_number?: string | null
          phone?: string | null
          pip_reason?: string | null
          pip_start_date?: string | null
          pip_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      program_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          device_info: Json | null
          id: string
          ip_address: unknown
          program_id: string
          quiz_answers: Json | null
          quiz_attempts: number | null
          quiz_passed: boolean | null
          quiz_score: number | null
          quiz_taken: boolean | null
          read_duration: number | null
          time_to_acknowledge: number | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          program_id: string
          quiz_answers?: Json | null
          quiz_attempts?: number | null
          quiz_passed?: boolean | null
          quiz_score?: number | null
          quiz_taken?: boolean | null
          read_duration?: number | null
          time_to_acknowledge?: number | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          program_id?: string
          quiz_answers?: Json | null
          quiz_attempts?: number | null
          quiz_passed?: boolean | null
          quiz_score?: number | null
          quiz_taken?: boolean | null
          read_duration?: number | null
          time_to_acknowledge?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_acknowledgments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          acknowledgment_count: number | null
          approval_date: string | null
          approved_by: string | null
          archive_date: string | null
          avg_quiz_score: number | null
          broker_comp_plan: string | null
          can_broker: boolean | null
          created_at: string | null
          created_by: string
          delegation_type: string | null
          guidelines_url: string | null
          has_quiz: boolean | null
          id: string
          internal_margin_bps: number | null
          investor_name: string
          is_featured: boolean | null
          parent_program_id: string | null
          pass_threshold: number | null
          program_name: string
          program_summary: string
          program_type: string
          published_at: string | null
          quiz_questions: Json | null
          rejection_reason: string | null
          sales_strategies: string | null
          status: string | null
          target_borrower: string | null
          updated_at: string | null
          version: number | null
          view_count: number | null
        }
        Insert: {
          acknowledgment_count?: number | null
          approval_date?: string | null
          approved_by?: string | null
          archive_date?: string | null
          avg_quiz_score?: number | null
          broker_comp_plan?: string | null
          can_broker?: boolean | null
          created_at?: string | null
          created_by: string
          delegation_type?: string | null
          guidelines_url?: string | null
          has_quiz?: boolean | null
          id?: string
          internal_margin_bps?: number | null
          investor_name: string
          is_featured?: boolean | null
          parent_program_id?: string | null
          pass_threshold?: number | null
          program_name: string
          program_summary: string
          program_type: string
          published_at?: string | null
          quiz_questions?: Json | null
          rejection_reason?: string | null
          sales_strategies?: string | null
          status?: string | null
          target_borrower?: string | null
          updated_at?: string | null
          version?: number | null
          view_count?: number | null
        }
        Update: {
          acknowledgment_count?: number | null
          approval_date?: string | null
          approved_by?: string | null
          archive_date?: string | null
          avg_quiz_score?: number | null
          broker_comp_plan?: string | null
          can_broker?: boolean | null
          created_at?: string | null
          created_by?: string
          delegation_type?: string | null
          guidelines_url?: string | null
          has_quiz?: boolean | null
          id?: string
          internal_margin_bps?: number | null
          investor_name?: string
          is_featured?: boolean | null
          parent_program_id?: string | null
          pass_threshold?: number | null
          program_name?: string
          program_summary?: string
          program_type?: string
          published_at?: string | null
          quiz_questions?: Json | null
          rejection_reason?: string | null
          sales_strategies?: string | null
          status?: string | null
          target_borrower?: string | null
          updated_at?: string | null
          version?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_parent_program_id_fkey"
            columns: ["parent_program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_alerts: {
        Row: {
          alert_type: string
          description: string | null
          id: string
          loan_officer_id: string
          metadata: Json | null
          resolution_note: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          triggered_at: string | null
        }
        Insert: {
          alert_type: string
          description?: string | null
          id?: string
          loan_officer_id: string
          metadata?: Json | null
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          triggered_at?: string | null
        }
        Update: {
          alert_type?: string
          description?: string | null
          id?: string
          loan_officer_id?: string
          metadata?: Json | null
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          triggered_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          celebrated: boolean | null
          celebrated_at: string | null
          earned_at: string | null
          id: string
          progress_value: number | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          celebrated?: boolean | null
          celebrated_at?: string | null
          earned_at?: string | null
          id?: string
          progress_value?: number | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          celebrated?: boolean | null
          celebrated_at?: string | null
          earned_at?: string | null
          id?: string
          progress_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
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
      calculate_leaderboard: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_period_type: string
        }
        Returns: undefined
      }
      calculate_momentum_score: {
        Args: { p_days?: number; p_user_id: string }
        Returns: number
      }
      check_license_expiry: { Args: never; Returns: undefined }
      generate_team_alerts: { Args: never; Returns: undefined }
      get_pending_acknowledgments: {
        Args: { p_user_id: string }
        Returns: {
          days_overdue: number
          effective_date: string
          item_category: string
          item_id: string
          item_title: string
          item_type: string
          requires_quiz: boolean
        }[]
      }
      get_period_dates: {
        Args: { p_period_type: string }
        Returns: {
          end_date: string
          start_date: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_all_leaderboards: { Args: never; Returns: undefined }
      update_contact_health: {
        Args: { p_contact_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "loan_officer" | "manager" | "super_admin"
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
    Enums: {
      app_role: ["loan_officer", "manager", "super_admin"],
    },
  },
} as const
