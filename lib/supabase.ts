import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          price: number
          is_free: boolean
          is_published: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          price?: number
          is_free?: boolean
          is_published?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          price?: number
          is_free?: boolean
          is_published?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      course_sections: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          section_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          section_order: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          section_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    lessons: {
      Row: {
        id: string
        section_id: string
        title: string
        description: string | null
        video_url: string | null
        video_duration: number | null
        lesson_order: number
        is_published: boolean
        is_last_video_of_week: boolean
        assignment_text: string | null
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        section_id: string
        title: string
        description?: string | null
        video_url?: string | null
        video_duration?: number | null
        lesson_order: number
        is_published?: boolean
        is_last_video_of_week?: boolean
        assignment_text?: string | null
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        section_id?: string
        title?: string
        description?: string | null
        video_url?: string | null
        video_duration?: number | null
        lesson_order?: number
        is_published?: boolean
        is_last_video_of_week?: boolean
        assignment_text?: string | null
        created_at?: string
        updated_at?: string
      }
    }
      course_enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string
          payment_status: 'pending' | 'paid' | 'free'
          payment_proof_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrolled_at?: string
          payment_status?: 'pending' | 'paid' | 'free'
          payment_proof_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrolled_at?: string
          payment_status?: 'pending' | 'paid' | 'free'
          payment_proof_url?: string | null
        }
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed_at: string
          watch_time: number
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed_at?: string
          watch_time?: number
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed_at?: string
          watch_time?: number
        }
      }
      lesson_comments: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          content: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          content: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          content?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          section_id: string
          title: string
          description: string | null
          instructions: string | null
          due_date: string | null
          max_points: number
          assignment_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_id: string
          title: string
          description?: string | null
          instructions?: string | null
          due_date?: string | null
          max_points?: number
          assignment_order: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          title?: string
          description?: string | null
          instructions?: string | null
          due_date?: string | null
          max_points?: number
          assignment_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assignment_submissions: {
        Row: {
          id: string
          lesson_id: string
          user_id: string
          file_url: string | null
          file_name: string | null
          file_size: number | null
          submission_text: string | null
          submission_files: string[] | null
          points_earned: number
          feedback: string | null
          submitted_at: string
          graded_at: string | null
          graded_by: string | null
        }
        Insert: {
          id?: string
          lesson_id: string
          user_id: string
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          submission_text?: string | null
          submission_files?: string[] | null
          points_earned?: number
          feedback?: string | null
          submitted_at?: string
          graded_at?: string | null
          graded_by?: string | null
        }
        Update: {
          id?: string
          lesson_id?: string
          user_id?: string
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          submission_text?: string | null
          submission_files?: string[] | null
          points_earned?: number
          feedback?: string | null
          submitted_at?: string
          graded_at?: string | null
          graded_by?: string | null
        }
      }
      portfolio_items: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          category: string | null
          project_url: string | null
          is_featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          category?: string | null
          project_url?: string | null
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          category?: string | null
          project_url?: string | null
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      testimonials: {
        Row: {
          id: string
          client_name: string
          client_title: string | null
          client_company: string | null
          content: string
          rating: number | null
          avatar_url: string | null
          is_featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_name: string
          client_title?: string | null
          client_company?: string | null
          content: string
          rating?: number | null
          avatar_url?: string | null
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_name?: string
          client_title?: string | null
          client_company?: string | null
          content?: string
          rating?: number | null
          avatar_url?: string | null
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          description?: string | null
          updated_at?: string
        }
      }
    }
  }
}


