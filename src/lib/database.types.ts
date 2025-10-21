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
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          description: string | null
          prompt_text: string
          model: string | null
          preview_output_url: string | null
          category: 'Code' | 'Writing' | 'Communication' | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          description?: string | null
          prompt_text: string
          model?: string | null
          preview_output_url?: string | null
          category?: 'Code' | 'Writing' | 'Communication' | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          description?: string | null
          prompt_text?: string
          model?: string | null
          preview_output_url?: string | null
          category?: 'Code' | 'Writing' | 'Communication' | null
        }
      }
      likes: {
        Row: {
          id: string
          prompt_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          prompt_id: string
          user_id: string
          comment_text: string
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          user_id: string
          comment_text: string
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          user_id?: string
          comment_text?: string
          created_at?: string
        }
      }
    }
  }
}
