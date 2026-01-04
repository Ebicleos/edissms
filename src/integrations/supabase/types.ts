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
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          expiry_date: string | null
          id: string
          is_published: boolean | null
          publish_date: string | null
          school_id: string | null
          target_audience: string | null
          title: string
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          is_published?: boolean | null
          publish_date?: string | null
          school_id?: string | null
          target_audience?: string | null
          title: string
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          is_published?: boolean | null
          publish_date?: string | null
          school_id?: string | null
          target_audience?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          file_url: string | null
          id: string
          is_published: boolean | null
          school_id: string | null
          subject: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          school_id?: string | null
          subject: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          school_id?: string | null
          subject?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string | null
          date: string
          id: string
          marked_by: string | null
          remarks: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          date: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          status: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          level: string
          name: string
          school_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          level: string
          name: string
          school_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          level?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string | null
          id: string
          is_all_day: boolean | null
          is_published: boolean | null
          location: string | null
          school_id: string | null
          start_time: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          is_published?: boolean | null
          location?: string | null
          school_id?: string | null
          start_time?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          is_published?: boolean | null
          location?: string | null
          school_id?: string | null
          start_time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          exam_id: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          started_at: string | null
          student_id: string
          suspicious_activity: Json | null
          tab_switches: number | null
          user_agent: string | null
        }
        Insert: {
          exam_id: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          started_at?: string | null
          student_id: string
          suspicious_activity?: Json | null
          tab_switches?: number | null
          user_agent?: string | null
        }
        Update: {
          exam_id?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          started_at?: string | null
          student_id?: string
          suspicious_activity?: Json | null
          tab_switches?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_submissions: {
        Row: {
          exam_id: string
          id: string
          is_submitted: boolean | null
          is_test: boolean | null
          score: number | null
          started_at: string | null
          student_id: string
          submitted_at: string | null
          total_marks: number | null
        }
        Insert: {
          exam_id: string
          id?: string
          is_submitted?: boolean | null
          is_test?: boolean | null
          score?: number | null
          started_at?: string | null
          student_id: string
          submitted_at?: string | null
          total_marks?: number | null
        }
        Update: {
          exam_id?: string
          id?: string
          is_submitted?: boolean | null
          is_test?: boolean | null
          score?: number | null
          started_at?: string | null
          student_id?: string
          submitted_at?: string | null
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string
          created_at: string | null
          duration_minutes: number
          end_time: string | null
          id: string
          is_exam_active: boolean | null
          is_published: boolean | null
          school_id: string | null
          start_time: string | null
          subject: string
          teacher_id: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          is_exam_active?: boolean | null
          is_published?: boolean | null
          school_id?: string | null
          start_time?: string | null
          subject: string
          teacher_id?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          is_exam_active?: boolean | null
          is_published?: boolean | null
          school_id?: string | null
          start_time?: string | null
          subject?: string
          teacher_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          academic_year: string
          amount_paid: number
          amount_payable: number
          balance: number | null
          class_id: string
          created_at: string | null
          id: string
          installment: string | null
          last_payment_date: string | null
          status: string | null
          student_id: string
          term: string
        }
        Insert: {
          academic_year: string
          amount_paid?: number
          amount_payable?: number
          balance?: number | null
          class_id: string
          created_at?: string | null
          id?: string
          installment?: string | null
          last_payment_date?: string | null
          status?: string | null
          student_id: string
          term: string
        }
        Update: {
          academic_year?: string
          amount_paid?: number
          amount_payable?: number
          balance?: number | null
          class_id?: string
          created_at?: string | null
          id?: string
          installment?: string | null
          last_payment_date?: string | null
          status?: string | null
          student_id?: string
          term?: string
        }
        Relationships: []
      }
      fee_structures: {
        Row: {
          academic_year: string
          books_fee: number | null
          class_id: string
          created_at: string | null
          development_fee: number | null
          exam_fee: number | null
          id: string
          other_fees: number | null
          school_id: string | null
          term: string
          total_amount: number | null
          tuition_fee: number | null
          uniform_fee: number | null
        }
        Insert: {
          academic_year: string
          books_fee?: number | null
          class_id: string
          created_at?: string | null
          development_fee?: number | null
          exam_fee?: number | null
          id?: string
          other_fees?: number | null
          school_id?: string | null
          term: string
          total_amount?: number | null
          tuition_fee?: number | null
          uniform_fee?: number | null
        }
        Update: {
          academic_year?: string
          books_fee?: number | null
          class_id?: string
          created_at?: string | null
          development_fee?: number | null
          exam_fee?: number | null
          id?: string
          other_fees?: number | null
          school_id?: string | null
          term?: string
          total_amount?: number | null
          tuition_fee?: number | null
          uniform_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_materials: {
        Row: {
          class_id: string
          created_at: string | null
          file_size: string | null
          file_type: string | null
          file_url: string
          id: string
          subject: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          file_size?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          subject: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          file_size?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          subject?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          class_id: string | null
          content: string
          created_at: string | null
          id: string
          recipients_type: string
          sent_at: string | null
          sent_by: string | null
          status: string | null
          subject: string | null
          type: string
        }
        Insert: {
          class_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          recipients_type: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string | null
          type: string
        }
        Update: {
          class_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          recipients_type?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: []
      }
      online_classes: {
        Row: {
          class_id: string
          created_at: string | null
          end_time: string | null
          id: string
          meeting_url: string | null
          start_time: string
          status: string | null
          subject: string | null
          teacher_id: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          meeting_url?: string | null
          start_time: string
          status?: string | null
          subject?: string | null
          teacher_id?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          meeting_url?: string | null
          start_time?: string
          status?: string | null
          subject?: string | null
          teacher_id?: string | null
          title?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          fee_payment_id: string
          id: string
          payment_date: string | null
          payment_method: string
          recorded_by: string | null
          status: string | null
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          fee_payment_id: string
          id?: string
          payment_date?: string | null
          payment_method: string
          recorded_by?: string | null
          status?: string | null
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          fee_payment_id?: string
          id?: string
          payment_date?: string | null
          payment_method?: string
          recorded_by?: string | null
          status?: string | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_fee_payment_id_fkey"
            columns: ["fee_payment_id"]
            isOneToOne: false
            referencedRelation: "fee_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone_contact: string | null
          photo_url: string | null
          school_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone_contact?: string | null
          photo_url?: string | null
          school_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone_contact?: string | null
          photo_url?: string | null
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_history: {
        Row: {
          academic_year: string
          average_score: number | null
          created_at: string | null
          from_class: string
          id: string
          promoted_by: string | null
          promotion_date: string | null
          status: string
          student_id: string
          to_class: string
        }
        Insert: {
          academic_year: string
          average_score?: number | null
          created_at?: string | null
          from_class: string
          id?: string
          promoted_by?: string | null
          promotion_date?: string | null
          status?: string
          student_id: string
          to_class: string
        }
        Update: {
          academic_year?: string
          average_score?: number | null
          created_at?: string | null
          from_class?: string
          id?: string
          promoted_by?: string | null
          promotion_date?: string | null
          status?: string
          student_id?: string
          to_class?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_option: string
          exam_id: string
          id: string
          marks: number | null
          option_a: string
          option_b: string
          option_c: string | null
          option_d: string | null
          order_index: number | null
          question_text: string
        }
        Insert: {
          correct_option: string
          exam_id: string
          id?: string
          marks?: number | null
          option_a: string
          option_b: string
          option_c?: string | null
          option_d?: string | null
          order_index?: number | null
          question_text: string
        }
        Update: {
          correct_option?: string
          exam_id?: string
          id?: string
          marks?: number | null
          option_a?: string
          option_b?: string
          option_c?: string | null
          option_d?: string | null
          order_index?: number | null
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          academic_year: string
          attendance_present: number | null
          attendance_total: number | null
          attitude: string | null
          average_score: number | null
          class_id: string
          closing_date: string | null
          conduct: string | null
          generated_at: string | null
          id: string
          interest: string | null
          next_term_begins: string | null
          position: number | null
          principal_remarks: string | null
          promotion_status: string | null
          student_id: string
          teacher_remarks: string | null
          term: string
          term_summary: Json | null
          total_marks_obtainable: number | null
          total_marks_obtained: number | null
          total_students: number | null
        }
        Insert: {
          academic_year: string
          attendance_present?: number | null
          attendance_total?: number | null
          attitude?: string | null
          average_score?: number | null
          class_id: string
          closing_date?: string | null
          conduct?: string | null
          generated_at?: string | null
          id?: string
          interest?: string | null
          next_term_begins?: string | null
          position?: number | null
          principal_remarks?: string | null
          promotion_status?: string | null
          student_id: string
          teacher_remarks?: string | null
          term: string
          term_summary?: Json | null
          total_marks_obtainable?: number | null
          total_marks_obtained?: number | null
          total_students?: number | null
        }
        Update: {
          academic_year?: string
          attendance_present?: number | null
          attendance_total?: number | null
          attitude?: string | null
          average_score?: number | null
          class_id?: string
          closing_date?: string | null
          conduct?: string | null
          generated_at?: string | null
          id?: string
          interest?: string | null
          next_term_begins?: string | null
          position?: number | null
          principal_remarks?: string | null
          promotion_status?: string | null
          student_id?: string
          teacher_remarks?: string | null
          term?: string
          term_summary?: Json | null
          total_marks_obtainable?: number | null
          total_marks_obtained?: number | null
          total_students?: number | null
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          academic_year: string | null
          address: string | null
          closing_date: string | null
          created_at: string | null
          email: string | null
          grading_scale: Json | null
          id: string
          logo_url: string | null
          motto: string | null
          next_term_begins: string | null
          phone: string | null
          principal_name: string | null
          report_card_config: Json | null
          school_id: string | null
          school_initials: string | null
          school_name: string | null
          term: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          closing_date?: string | null
          created_at?: string | null
          email?: string | null
          grading_scale?: Json | null
          id?: string
          logo_url?: string | null
          motto?: string | null
          next_term_begins?: string | null
          phone?: string | null
          principal_name?: string | null
          report_card_config?: Json | null
          school_id?: string | null
          school_initials?: string | null
          school_name?: string | null
          term?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          closing_date?: string | null
          created_at?: string | null
          email?: string | null
          grading_scale?: Json | null
          id?: string
          logo_url?: string | null
          motto?: string | null
          next_term_begins?: string | null
          phone?: string | null
          principal_name?: string | null
          report_card_config?: Json | null
          school_id?: string | null
          school_initials?: string | null
          school_name?: string | null
          term?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          code: string
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          initials: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          payment_gateway_enabled: boolean | null
          payment_gateway_provider: string | null
          payment_gateway_public_key: string | null
          payment_gateway_secret_key: string | null
          payment_gateway_webhook_secret: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          initials?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          payment_gateway_enabled?: boolean | null
          payment_gateway_provider?: string | null
          payment_gateway_public_key?: string | null
          payment_gateway_secret_key?: string | null
          payment_gateway_webhook_secret?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          initials?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          payment_gateway_enabled?: boolean | null
          payment_gateway_provider?: string | null
          payment_gateway_public_key?: string | null
          payment_gateway_secret_key?: string | null
          payment_gateway_webhook_secret?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          id: string
          is_correct: boolean | null
          question_id: string
          selected_option: string | null
          submission_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_option?: string | null
          submission_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_option?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "exam_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_classes: {
        Row: {
          admission_number: string | null
          class_id: string
          created_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          admission_number?: string | null
          class_id: string
          created_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          admission_number?: string | null
          class_id?: string
          created_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      student_grades: {
        Row: {
          academic_year: string
          ca1_score: number | null
          ca2_score: number | null
          ca3_score: number | null
          class_id: string
          created_at: string | null
          exam_score: number | null
          grade: string | null
          id: string
          remarks: string | null
          student_id: string
          subject_id: string | null
          subject_name: string
          subject_position: number | null
          term: string
          theory_score: number | null
          total_score: number | null
        }
        Insert: {
          academic_year: string
          ca1_score?: number | null
          ca2_score?: number | null
          ca3_score?: number | null
          class_id: string
          created_at?: string | null
          exam_score?: number | null
          grade?: string | null
          id?: string
          remarks?: string | null
          student_id: string
          subject_id?: string | null
          subject_name: string
          subject_position?: number | null
          term: string
          theory_score?: number | null
          total_score?: number | null
        }
        Update: {
          academic_year?: string
          ca1_score?: number | null
          ca2_score?: number | null
          ca3_score?: number | null
          class_id?: string
          created_at?: string | null
          exam_score?: number | null
          grade?: string | null
          id?: string
          remarks?: string | null
          student_id?: string
          subject_id?: string | null
          subject_name?: string
          subject_position?: number | null
          term?: string
          theory_score?: number | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year: string | null
          address: string | null
          admission_fee: number | null
          admission_number: string
          class_id: string
          created_at: string | null
          date_of_admission: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string
          guardian_name: string | null
          id: string
          phone_contact: string | null
          photo_url: string | null
          school_id: string | null
          term: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          admission_fee?: number | null
          admission_number: string
          class_id: string
          created_at?: string | null
          date_of_admission?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender: string
          guardian_name?: string | null
          id?: string
          phone_contact?: string | null
          photo_url?: string | null
          school_id?: string | null
          term?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          admission_fee?: number | null
          admission_number?: string
          class_id?: string
          created_at?: string | null
          date_of_admission?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string
          guardian_name?: string | null
          id?: string
          phone_contact?: string | null
          photo_url?: string | null
          school_id?: string | null
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_id: string | null
          code: string | null
          created_at: string | null
          id: string
          name: string
          school_id: string | null
        }
        Insert: {
          class_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          school_id?: string | null
        }
        Update: {
          class_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string | null
          end_date: string
          id: string
          max_students: number | null
          max_teachers: number | null
          payment_reference: string | null
          plan_type: string
          school_id: string
          start_date: string
          status: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          end_date: string
          id?: string
          max_students?: number | null
          max_teachers?: number | null
          payment_reference?: string | null
          plan_type: string
          school_id: string
          start_date?: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          end_date?: string
          id?: string
          max_students?: number | null
          max_teachers?: number | null
          payment_reference?: string | null
          plan_type?: string
          school_id?: string
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          teacher_id: string | null
          teacher_record_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          teacher_id?: string | null
          teacher_record_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          teacher_id?: string | null
          teacher_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_teacher_record_id_fkey"
            columns: ["teacher_record_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          school_id: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          school_id?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          school_id?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_password_resets: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          requested_by: string
          reset_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          requested_by: string
          reset_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          requested_by?: string
          reset_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_by_admission_number: {
        Args: { _admission_number: string }
        Returns: string
      }
      get_user_class: { Args: { _user_id: string }; Returns: string }
      get_user_school: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_student_for_signup: {
        Args: { admission_num: string; student_name: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "superadmin"
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
      app_role: ["admin", "teacher", "student", "superadmin"],
    },
  },
} as const
