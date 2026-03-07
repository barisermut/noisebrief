export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      daily_briefs: {
        Row: {
          id: string;
          date: string;
          title: string | null;
          summary: string;
          paragraphs: Json | null;
          sources: Json;
          generated_posts: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          title?: string | null;
          summary: string;
          paragraphs?: Json | null;
          sources: Json;
          generated_posts?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          title?: string | null;
          summary?: string;
          paragraphs?: Json | null;
          sources?: Json;
          generated_posts?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_generated_post_if_missing: {
        Args: { brief_date: string; tone_key: string; post_text: string };
        Returns: void;
      };
    };
  };
}
