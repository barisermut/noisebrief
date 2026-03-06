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
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          title?: string | null;
          summary: string;
          paragraphs?: Json | null;
          sources: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          title?: string | null;
          summary?: string;
          paragraphs?: Json | null;
          sources?: Json;
          created_at?: string;
        };
      };
    };
  };
}
