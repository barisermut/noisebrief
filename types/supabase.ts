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
        Relationships: [];
      };
      email_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
          unsubscribe_token: string;
          unsubscribed_at: string | null;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          subscribed_at?: string;
          unsubscribe_token: string;
          unsubscribed_at?: string | null;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          subscribed_at?: string;
          unsubscribe_token?: string;
          unsubscribed_at?: string | null;
          confirmed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
