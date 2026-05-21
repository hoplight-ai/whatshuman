// Types matching supabase_schema.sql exactly

export type SourceType = "human" | "ai";

export type Register =
  | "linkedin_post"
  | "strategic_memo"
  | "op_ed"
  | "newsletter"
  | "casual"
  | "literary"
  | "academic"
  | "journalism"
  | "other";

export type AgeBucket = "under_25" | "25_to_40" | "40_to_60" | "60_plus";

export type PrimaryRegister =
  | "academic"
  | "business"
  | "journalism"
  | "marketing"
  | "creative"
  | "casual"
  | "other";

export type HumanEra =
  | "pre-1928"
  | "1928-1950"
  | "1950-1980"
  | "1980-2010"
  | "2010-2020"
  | "post-2020";

export interface Phrase {
  id: string;
  text: string;
  word_count: number;
  source_type: SourceType;
  register: Register;
  human_source: string | null;
  human_era: HumanEra | null;
  human_source_url: string | null;
  tell_density: number | null;
  tells_present: string[] | null;
  approved: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  user_agent_hash: string | null;
  age_bucket: AgeBucket | null;
  primary_register: PrimaryRegister | null;
  started_at: string;
  last_seen_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  phrase_id: string;
  vote: SourceType;
  was_correct: boolean;
  voted_at: string;
}

export interface PhraseVoteStats {
  phrase_id: string;
  source_type: SourceType;
  total_votes: number;
  votes_human: number;
  votes_ai: number;
  community_accuracy_pct: number;
}

// Supabase Database type for the client
export interface Database {
  public: {
    Tables: {
      phrases: {
        Row: Phrase;
        Insert: Omit<Phrase, "id" | "created_at">;
        Update: Partial<Omit<Phrase, "id">>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "started_at" | "last_seen_at">;
        Update: Partial<Omit<Session, "id">>;
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, "id" | "voted_at">;
        Update: Partial<Omit<Vote, "id">>;
      };
    };
    Views: {
      phrase_vote_stats: {
        Row: PhraseVoteStats;
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
