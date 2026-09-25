import { supabase, type Phrase, type SourceType, type Register } from "./supabase";

const envLen = Number(import.meta.env.VITE_ROUND_LENGTH);
export const ROUND_LENGTH = Number.isFinite(envLen) && envLen > 0 ? Math.floor(envLen) : 10;
export const MAX_ROUND_LENGTH = 30;
export const ROUND_INCREMENT = 5;

export function nextRoundLength(current: number): number {
  return Math.min(current + ROUND_INCREMENT, MAX_ROUND_LENGTH);
}

// Pre-fetch the round's phrases once: balance ~50/50 human/AI, exclude already-seen ids.
export async function fetchRoundPhrases(excludeIds: string[] = [], length = ROUND_LENGTH): Promise<Phrase[]> {
  const perSide = Math.ceil(length / 2);
  const POOL = Math.max(perSide * 4, 40);

  const baseQuery = (source: SourceType) => {
    let q = supabase
      .from("phrases")
      .select(
        "id, text, word_count, source_type, register, human_source, human_source_url, human_era, ai_model_internal, ai_prompt_id, tell_density, tells_present, approved",
      )
      .eq("approved", true)
      .eq("source_type", source)
      .limit(POOL);
    if (excludeIds.length > 0) {
      q = q.not("id", "in", `(${excludeIds.join(",")})`);
    }
    return q;
  };

  const [humanRes, aiRes] = await Promise.all([baseQuery("human"), baseQuery("ai")]);

  if (humanRes.error) throw humanRes.error;
  if (aiRes.error) throw aiRes.error;

  const humans = shuffle(humanRes.data ?? []) as Phrase[];
  const ais = shuffle(aiRes.data ?? []) as Phrase[];

  const out: Phrase[] = [];
  let hi = 0;
  let ai = 0;
  while (out.length < length && (hi < humans.length || ai < ais.length)) {
    if (hi < humans.length && (out.length % 2 === 0 || ai >= ais.length)) {
      out.push(humans[hi++]);
    } else if (ai < ais.length) {
      out.push(ais[ai++]);
    } else if (hi < humans.length) {
      out.push(humans[hi++]);
    }
  }
  return shuffle(out).slice(0, length);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface CommunitySplit {
  human_pct: number;
  ai_pct: number;
  total: number;
}

// Read community split via the votes table. Column is `vote` (not `vote_value`).
export async function getCommunitySplit(phraseId: string): Promise<CommunitySplit> {
  const [humanRes, aiRes] = await Promise.all([
    supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("phrase_id", phraseId)
      .eq("vote", "human"),
    supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("phrase_id", phraseId)
      .eq("vote", "ai"),
  ]);
  const human = humanRes.count ?? 0;
  const ai = aiRes.count ?? 0;
  const total = human + ai;
  if (total === 0) return { human_pct: 50, ai_pct: 50, total: 0 };
  return {
    human_pct: Math.round((human / total) * 100),
    ai_pct: Math.round((ai / total) * 100),
    total,
  };
}

export interface VoteRecord {
  session_id: string;
  phrase_id: string;
  vote: SourceType;
  was_correct: boolean;
}

// Insert a vote. Returns the inserted row's id so callers can attach
// follow-up records (e.g. vote_explanations) via FK. Throws with full
// Supabase error on failure so the caller can log details and surface a UI warning.
export async function recordVote(v: VoteRecord): Promise<string | null> {
  const { data, error } = await supabase.from("votes").insert(v).select("id").single();
  if (error) {
    // Treat unique_violation (Postgres 23505 / HTTP 409) as success — the row is already there.
    const status = (error as { status?: number; code?: string }).status;
    if (error.code === "23505" || status === 409) {
      console.debug("[recordVote] vote already recorded — treating as success");
      return null;
    }
    // Log full error object (code, message, details, hint) for diagnosis.
    console.error("[recordVote] Supabase insert failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload: v,
    });
    throw error;
  }
  return data.id as string;
}

export interface VoteExplanation {
  vote_id: string;
  clicked_word_indices: number[];
  qualitative_text: string | null;
}

// Insert a vote explanation. Errors are logged but never thrown — the caller
// treats failure as a no-op and continues to the next phrase.
export async function recordVoteExplanation(e: VoteExplanation): Promise<void> {
  const { error } = await supabase.from("vote_explanations").insert(e);
  if (error) {
    console.error("[recordVoteExplanation] Supabase insert failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload: e,
    });
  }
}

// Aggregate the most-clicked word indices across correct votes for a phrase.
// Returns the set of word indices that fall in the top `topPct` fraction
// (by frequency). Errors are swallowed and an empty set is returned.
export async function getTopClickedWordIndices(
  phraseId: string,
  topPct = 0.3,
): Promise<Set<number>> {
  try {
    // Get all correct vote ids for this phrase
    const { data: voteRows, error: voteErr } = await supabase
      .from("votes")
      .select("id")
      .eq("phrase_id", phraseId)
      .eq("was_correct", true);
    if (voteErr) throw voteErr;
    const voteIds = (voteRows ?? []).map((r) => r.id as string);
    if (voteIds.length === 0) return new Set();

    const { data: explRows, error: explErr } = await supabase
      .from("vote_explanations")
      .select("clicked_word_indices")
      .in("vote_id", voteIds);
    if (explErr) throw explErr;

    const counts = new Map<number, number>();
    for (const row of explRows ?? []) {
      const indices = (row.clicked_word_indices as number[] | null) ?? [];
      for (const i of indices) {
        counts.set(i, (counts.get(i) ?? 0) + 1);
      }
    }
    if (counts.size === 0) return new Set();

    // Top 30% by frequency: take the indices whose count >= threshold
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const cutoff = Math.max(1, Math.ceil(sorted.length * topPct));
    return new Set(sorted.slice(0, cutoff).map(([idx]) => idx));
  } catch (e) {
    console.error("[getTopClickedWordIndices] failed:", e);
    return new Set();
  }
}

export interface SessionUpsert {
  id: string;
  age_bucket?: string | null;
  primary_register?: Register | null;
}

export async function upsertSession(s: SessionUpsert) {
  const { error } = await supabase.from("sessions").upsert(s, { onConflict: "id" });
  if (error) {
    console.error("[upsertSession] Supabase upsert failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload: s,
    });
    throw error;
  }
}
