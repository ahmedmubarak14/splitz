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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string
          progress: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress_history: {
        Row: {
          challenge_id: string | null
          id: string
          progress: number
          recorded_at: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          id?: string
          progress: number
          recorded_at?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          id?: string
          progress?: number
          recorded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_history_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          category: Database["public"]["Enums"]["challenge_category"] | null
          created_at: string
          creator_id: string
          current_value: number | null
          description: string | null
          difficulty: Database["public"]["Enums"]["challenge_difficulty"] | null
          end_date: string
          id: string
          name: string
          start_date: string
          target_value: number | null
          type: Database["public"]["Enums"]["challenge_type"] | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["challenge_category"] | null
          created_at?: string
          creator_id: string
          current_value?: number | null
          description?: string | null
          difficulty?:
            | Database["public"]["Enums"]["challenge_difficulty"]
            | null
          end_date: string
          id?: string
          name: string
          start_date: string
          target_value?: number | null
          type?: Database["public"]["Enums"]["challenge_type"] | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["challenge_category"] | null
          created_at?: string
          creator_id?: string
          current_value?: number | null
          description?: string | null
          difficulty?:
            | Database["public"]["Enums"]["challenge_difficulty"]
            | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          target_value?: number | null
          type?: Database["public"]["Enums"]["challenge_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      expense_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_members: {
        Row: {
          amount_owed: number
          created_at: string
          expense_id: string
          id: string
          is_settled: boolean | null
          paid_at: string | null
          split_value: number | null
          user_id: string
        }
        Insert: {
          amount_owed: number
          created_at?: string
          expense_id: string
          id?: string
          is_settled?: boolean | null
          paid_at?: string | null
          split_value?: number | null
          user_id: string
        }
        Update: {
          amount_owed?: number
          created_at?: string
          expense_id?: string
          id?: string
          is_settled?: boolean | null
          paid_at?: string | null
          split_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_members_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          category: Database["public"]["Enums"]["expense_category"] | null
          created_at: string
          description: string | null
          group_id: string | null
          id: string
          is_recurring: boolean | null
          name: string
          paid_by: string | null
          receipt_url: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          split_type: Database["public"]["Enums"]["split_type"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean | null
          name: string
          paid_by?: string | null
          receipt_url?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          split_type?: Database["public"]["Enums"]["split_type"]
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string
          paid_by?: string | null
          receipt_url?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          split_type?: Database["public"]["Enums"]["split_type"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          id: string
          is_break: boolean | null
          round_number: number | null
          session_type: string | null
          start_time: string
          task_id: string | null
          tree_survived: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_break?: boolean | null
          round_number?: number | null
          session_type?: string | null
          start_time?: string
          task_id?: string | null
          tree_survived?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_break?: boolean | null
          round_number?: number | null
          session_type?: string | null
          start_time?: string
          task_id?: string | null
          tree_survived?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "focus_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_tasks: {
        Row: {
          completed_at: string | null
          completed_pomodoros: number | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_pomodoros: number | null
          has_reminder: boolean | null
          icon: string | null
          id: string
          is_completed: boolean | null
          order_index: number | null
          parent_task_id: string | null
          priority_quadrant:
            | Database["public"]["Enums"]["priority_quadrant"]
            | null
          project: string | null
          reminder_time: string | null
          repeat_pattern: string | null
          title: string
          total_time_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_pomodoros?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_pomodoros?: number | null
          has_reminder?: boolean | null
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          parent_task_id?: string | null
          priority_quadrant?:
            | Database["public"]["Enums"]["priority_quadrant"]
            | null
          project?: string | null
          reminder_time?: string | null
          repeat_pattern?: string | null
          title: string
          total_time_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_pomodoros?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_pomodoros?: number | null
          has_reminder?: boolean | null
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          parent_task_id?: string | null
          priority_quadrant?:
            | Database["public"]["Enums"]["priority_quadrant"]
            | null
          project?: string | null
          reminder_time?: string | null
          repeat_pattern?: string | null
          title?: string
          total_time_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "focus_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_check_ins: {
        Row: {
          checked_in_at: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_check_ins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          best_streak: number | null
          category: Database["public"]["Enums"]["habit_category"] | null
          completion_date: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          last_completed_at: string | null
          last_freeze_used_at: string | null
          name: string
          reminder_enabled: boolean | null
          reminder_time: string | null
          streak_count: number | null
          streak_freezes_available: number | null
          tags: string[] | null
          target_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          category?: Database["public"]["Enums"]["habit_category"] | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          last_completed_at?: string | null
          last_freeze_used_at?: string | null
          name: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak_count?: number | null
          streak_freezes_available?: number | null
          tags?: string[] | null
          target_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number | null
          category?: Database["public"]["Enums"]["habit_category"] | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          last_completed_at?: string | null
          last_freeze_used_at?: string | null
          name?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak_count?: number | null
          streak_freezes_available?: number | null
          tags?: string[] | null
          target_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string
          current_uses: number | null
          expires_at: string | null
          id: string
          invite_code: string
          invite_type: string
          max_uses: number | null
          payload: Json | null
          resource_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invite_code: string
          invite_type: string
          max_uses?: number | null
          payload?: Json | null
          resource_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          invite_type?: string
          max_uses?: number | null
          payload?: Json | null
          resource_id?: string
        }
        Relationships: []
      }
      navigation_preferences: {
        Row: {
          created_at: string | null
          id: string
          nav_order: Json | null
          updated_at: string | null
          user_id: string
          visible_nav_items: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nav_order?: Json | null
          updated_at?: string | null
          user_id: string
          visible_nav_items?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nav_order?: Json | null
          updated_at?: string | null
          user_id?: string
          visible_nav_items?: Json | null
        }
        Relationships: []
      }
      net_balances: {
        Row: {
          amount: number
          created_at: string
          from_user_id: string
          group_id: string
          id: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          from_user_id: string
          group_id: string
          id?: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_user_id?: string
          group_id?: string
          id?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_balances_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          challenge_updates: boolean
          created_at: string
          email_notifications: boolean
          expense_alerts: boolean
          habit_reminders: boolean
          id: string
          push_notifications: boolean
          reminder_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_updates?: boolean
          created_at?: string
          email_notifications?: boolean
          expense_alerts?: boolean
          habit_reminders?: boolean
          id?: string
          push_notifications?: boolean
          reminder_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_updates?: boolean
          created_at?: string
          email_notifications?: boolean
          expense_alerts?: boolean
          habit_reminders?: boolean
          id?: string
          push_notifications?: boolean
          reminder_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          resource_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          resource_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          resource_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_confirmations: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          expense_member_id: string | null
          id: string
          notes: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          expense_member_id?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          expense_member_id?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_confirmations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_confirmations_expense_member_id_fkey"
            columns: ["expense_member_id"]
            isOneToOne: false
            referencedRelation: "expense_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          preferred_language: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          preferred_language?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          preferred_language?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number | null
          created_at: string | null
          id: string
          user_id: string
          window_start: string | null
        }
        Insert: {
          action: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id: string
          window_start?: string | null
        }
        Update: {
          action?: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      streak_freeze_history: {
        Row: {
          created_at: string | null
          habit_id: string
          id: string
          streak_saved: number
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          habit_id: string
          id?: string
          streak_saved: number
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          habit_id?: string
          id?: string
          streak_saved?: number
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_freeze_history_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_contributors: {
        Row: {
          approved_at: string | null
          contribution_amount: number
          created_at: string
          id: string
          is_settled: boolean | null
          last_reminder_sent: string | null
          paid_at: string | null
          payment_submitted: boolean
          split_value: number | null
          submission_at: string | null
          subscription_id: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          contribution_amount: number
          created_at?: string
          id?: string
          is_settled?: boolean | null
          last_reminder_sent?: string | null
          paid_at?: string | null
          payment_submitted?: boolean
          split_value?: number | null
          submission_at?: string | null
          subscription_id: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          contribution_amount?: number
          created_at?: string
          id?: string
          is_settled?: boolean | null
          last_reminder_sent?: string | null
          paid_at?: string | null
          payment_submitted?: boolean
          split_value?: number | null
          submission_at?: string | null
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_contributors_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          id: string
          notes: string | null
          paid_at: string
          subscription_id: string
        }
        Insert: {
          amount: number
          id?: string
          notes?: string | null
          paid_at?: string
          subscription_id: string
        }
        Update: {
          amount?: number
          id?: string
          notes?: string | null
          paid_at?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_reminders: {
        Row: {
          created_at: string
          days_before: number
          id: string
          sent_at: string | null
          subscription_id: string
        }
        Insert: {
          created_at?: string
          days_before: number
          id?: string
          sent_at?: string | null
          subscription_id: string
        }
        Update: {
          created_at?: string
          days_before?: number
          id?: string
          sent_at?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_reminders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          canceled_at: string | null
          category: string | null
          created_at: string
          currency: string
          custom_cycle_days: number | null
          id: string
          is_active: boolean | null
          is_shared: boolean | null
          logo_url: string | null
          name: string
          next_renewal_date: string
          notes: string | null
          notifications_enabled: boolean | null
          paused_at: string | null
          reminder_days_before: number | null
          split_type:
            | Database["public"]["Enums"]["subscription_split_type"]
            | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle: string
          canceled_at?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          custom_cycle_days?: number | null
          id?: string
          is_active?: boolean | null
          is_shared?: boolean | null
          logo_url?: string | null
          name: string
          next_renewal_date: string
          notes?: string | null
          notifications_enabled?: boolean | null
          paused_at?: string | null
          reminder_days_before?: number | null
          split_type?:
            | Database["public"]["Enums"]["subscription_split_type"]
            | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          canceled_at?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          custom_cycle_days?: number | null
          id?: string
          is_active?: boolean | null
          is_shared?: boolean | null
          logo_url?: string | null
          name?: string
          next_renewal_date?: string
          notes?: string | null
          notifications_enabled?: boolean | null
          paused_at?: string | null
          reminder_days_before?: number | null
          split_type?:
            | Database["public"]["Enums"]["subscription_split_type"]
            | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_shares: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_shares_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "focus_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_comments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          id: string
          joined_at: string
          role: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_tasks: {
        Row: {
          assigned_to: string | null
          assigned_to_group: boolean | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_group?: boolean | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_group?: boolean | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_tasks_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          destination: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          destination?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          destination?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_profile_emails: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_join_via_invite: {
        Args: { _invite_type: string; _resource_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_message: string
          p_resource_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_invitation_by_code: {
        Args: { _invite_code: string }
        Returns: {
          created_at: string
          created_by: string
          current_uses: number
          expires_at: string
          id: string
          invite_code: string
          invite_type: string
          max_uses: number
          resource_id: string
        }[]
      }
      habit_checkin_date: {
        Args: { checked_in_at: string }
        Returns: string
      }
      increment_invitation_uses: {
        Args: { _invitation_id: string }
        Returns: undefined
      }
      is_challenge_member: {
        Args: { _challenge_id: string; _user_id: string }
        Returns: boolean
      }
      is_expense_member: {
        Args: { _expense_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_subscription_contributor: {
        Args: { _subscription_id: string; _user_id: string }
        Returns: boolean
      }
      is_subscription_owner: {
        Args: { _subscription_id: string; _user_id: string }
        Returns: boolean
      }
      is_subscription_owner_and_shared: {
        Args: { _subscription_id: string; _user_id: string }
        Returns: boolean
      }
      is_trip_member: {
        Args: { _trip_id: string; _user_id: string }
        Returns: boolean
      }
      notify_upcoming_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalc_expense_split: {
        Args: { _expense_id: string }
        Returns: undefined
      }
      recalc_net_balances: {
        Args: { _group_id: string }
        Returns: undefined
      }
      recalc_subscription_split: {
        Args: { _subscription_id: string }
        Returns: undefined
      }
    }
    Enums: {
      challenge_category:
        | "fitness"
        | "learning"
        | "productivity"
        | "health"
        | "finance"
        | "social"
        | "other"
      challenge_difficulty: "easy" | "medium" | "hard"
      challenge_type: "percentage" | "habit" | "metric" | "steps"
      expense_category:
        | "food"
        | "transport"
        | "entertainment"
        | "utilities"
        | "shopping"
        | "health"
        | "education"
        | "other"
      habit_category:
        | "health"
        | "productivity"
        | "fitness"
        | "learning"
        | "social"
        | "mindfulness"
        | "finance"
        | "other"
      priority_quadrant:
        | "urgent_important"
        | "not_urgent_important"
        | "urgent_unimportant"
        | "not_urgent_unimportant"
      split_type: "equal" | "percentage" | "custom" | "shares"
      subscription_split_type: "equal" | "percentage" | "custom" | "shares"
      subscription_status: "active" | "canceled" | "paused" | "archived"
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
      challenge_category: [
        "fitness",
        "learning",
        "productivity",
        "health",
        "finance",
        "social",
        "other",
      ],
      challenge_difficulty: ["easy", "medium", "hard"],
      challenge_type: ["percentage", "habit", "metric", "steps"],
      expense_category: [
        "food",
        "transport",
        "entertainment",
        "utilities",
        "shopping",
        "health",
        "education",
        "other",
      ],
      habit_category: [
        "health",
        "productivity",
        "fitness",
        "learning",
        "social",
        "mindfulness",
        "finance",
        "other",
      ],
      priority_quadrant: [
        "urgent_important",
        "not_urgent_important",
        "urgent_unimportant",
        "not_urgent_unimportant",
      ],
      split_type: ["equal", "percentage", "custom", "shares"],
      subscription_split_type: ["equal", "percentage", "custom", "shares"],
      subscription_status: ["active", "canceled", "paused", "archived"],
    },
  },
} as const
