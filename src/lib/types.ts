// ────────────────────────────────────────────────────────────────
// Database Types — generated from YOUSUFS_ schema
// Keep in sync with supabase/migrations/001_initial_schema.sql
// ────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      YOUSUFS_profiles: {
        Row: {
          id: string;
          display_name: string;
          email: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: 'admin' | 'viewer';
          meta: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          email?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'admin' | 'viewer';
          meta?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['YOUSUFS_profiles']['Insert']>;
      };
      YOUSUFS_site_content: {
        Row: {
          id: string;
          content_key: string;
          content_value: string | null;
          content_type: 'text' | 'html' | 'json' | 'url' | 'boolean' | 'number';
          label: string | null;
          description: string | null;
          section: string;
          is_public: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_key: string;
          content_value?: string | null;
          content_type?: 'text' | 'html' | 'json' | 'url' | 'boolean' | 'number';
          label?: string | null;
          description?: string | null;
          section?: string;
          is_public?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['YOUSUFS_site_content']['Insert']>;
      };
      YOUSUFS_media_library: {
        Row: {
          id: string;
          file_name: string;
          storage_path: string;
          public_url: string | null;
          alt_text: string | null;
          description: string | null;
          mime_type: string;
          file_size_bytes: number | null;
          width: number | null;
          height: number | null;
          tags: string[];
          is_active: boolean;
          uploaded_by: string | null;
          meta: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          storage_path: string;
          public_url?: string | null;
          alt_text?: string | null;
          description?: string | null;
          mime_type: string;
          file_size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          tags?: string[];
          is_active?: boolean;
          uploaded_by?: string | null;
          meta?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['YOUSUFS_media_library']['Insert']>;
      };
      YOUSUFS_automation_cases: {
        Row: {
          id: string;
          title: string;
          slug: string;
          client_name: string | null;
          industry: string | null;
          challenge: string;
          solution: string;
          outcome: string;
          tech_stack: string[];
          roi_metric: string | null;
          duration_weeks: number | null;
          status: 'draft' | 'published' | 'archived';
          is_featured: boolean;
          cover_image_id: string | null;
          tags: string[];
          sort_order: number;
          meta: Record<string, unknown>;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          client_name?: string | null;
          industry?: string | null;
          challenge: string;
          solution: string;
          outcome: string;
          tech_stack?: string[];
          roi_metric?: string | null;
          duration_weeks?: number | null;
          status?: 'draft' | 'published' | 'archived';
          is_featured?: boolean;
          cover_image_id?: string | null;
          tags?: string[];
          sort_order?: number;
          meta?: Record<string, unknown>;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['YOUSUFS_automation_cases']['Insert']>;
      };
      YOUSUFS_tasks_logs: {
        Row: {
          id: string;
          task_name: string;
          task_type: 'system' | 'manual' | 'scheduled' | 'api' | 'auth' | 'error' | 'content';
          status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
          description: string | null;
          payload: Record<string, unknown>;
          result: Record<string, unknown>;
          error_message: string | null;
          duration_ms: number | null;
          triggered_by: string | null;
          ip_address: string | null;
          user_agent: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_name: string;
          task_type?: 'system' | 'manual' | 'scheduled' | 'api' | 'auth' | 'error' | 'content';
          status?: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
          description?: string | null;
          payload?: Record<string, unknown>;
          result?: Record<string, unknown>;
          error_message?: string | null;
          duration_ms?: number | null;
          triggered_by?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['YOUSUFS_tasks_logs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ── Convenience row type aliases ─────────────────────────────────
export type Profile      = Database['public']['Tables']['YOUSUFS_profiles']['Row'];
export type SiteContent  = Database['public']['Tables']['YOUSUFS_site_content']['Row'];
export type MediaItem    = Database['public']['Tables']['YOUSUFS_media_library']['Row'];
export type AutomationCase = Database['public']['Tables']['YOUSUFS_automation_cases']['Row'];
export type TaskLog      = Database['public']['Tables']['YOUSUFS_tasks_logs']['Row'];

/** Flat key→value map of all site_content rows, indexed by content_key */
export type ContentMap = Record<string, string>;
