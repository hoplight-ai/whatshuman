import { supabase } from "./supabase";
import type {
  Phrase,
  Session,
  SourceType,
  AgeBucket,
  PrimaryRegister,
  PhraseVoteStats,
} from "./types";

const ROUND_LENGTH = parseInt(process.env.NEXT_PUBLIC_ROUND_LENGTH || "30", 10);
const SESSION_KEY = "whatshuman_session_id";

// --- Session management ---

function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

function storeSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, id);
}

async function hashUserAgent(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ua)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getOrCreateSession(): Promise<Session> {
  const existingId = getStoredSessionId();

  if (existingId) {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", existingId)
      .single();

    if (data) {
      // Touch last_seen_at
      await supabase
        .from("sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", existingId);
      return data as Session;
    }
  }

  // Create new session
  const hash = await hashUserAgent();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_agent_hash: hash })
    .select()
    .single();

  if (error || !data) throw new Error("Failed to create session");

  storeSessionId(data.id);
  return data as Session;
}

export async function updateSessionDemographics(
  sessionId: string,
  ageBucket: AgeBucket | null,
  primaryRegister: PrimaryRegister | null
): Promise<void> {
  await supabase
    .from("sessions")
    .update({
      age_bucket: ageBucket,
      primary_register: primaryRegister,
    })
    .eq("id", sessionId);
}

// --- Phrase selection ---

export async function fetchRoundPhrases(
  sessionId: string
): Promise<Phrase[]> {
  // Get phrase IDs already voted on in this session
  const { data: existingVotes } = await supabase
    .from("votes")
    .select("phrase_id")
    .eq("session_id", sessionId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seenIds = (existingVotes || []).map((v: any) => v.phrase_id as string);

  // Fetch all approved phrases not yet seen
  let query = supabase
    .from("phrases")
    .select("*")
    .eq("approved", true);

  if (seenIds.length > 0) {
    // Supabase "not in" filter
    query = query.not("id", "in", `(${seenIds.join(",")})`);
  }

  const { data: allPhrases, error } = await query;

  if (error || !allPhrases) return [];

  const phrases = allPhrases as Phrase[];

  // Separate by source type for balanced selection
  const human = phrases.filter((p) => p.source_type === "human");
  const ai = phrases.filter((p) => p.source_type === "ai");

  // Shuffle both pools
  shuffle(human);
  shuffle(ai);

  // Interleave: take half from each, up to ROUND_LENGTH
  const half = Math.ceil(ROUND_LENGTH / 2);
  const selected: Phrase[] = [];

  const humanPick = human.slice(0, half);
  const aiPick = ai.slice(0, half);

  // If one pool is short, fill from the other
  selected.push(...humanPick, ...aiPick);

  // If we still need more (one pool was too small)
  if (selected.length < ROUND_LENGTH) {
    const remaining = phrases.filter(
      (p) => !selected.find((s) => s.id === p.id)
    );
    shuffle(remaining);
    selected.push(...remaining.slice(0, ROUND_LENGTH - selected.length));
  }

  // Trim to round length and shuffle the final order
  const round = selected.slice(0, ROUND_LENGTH);
  shuffle(round);

  return round;
}

// --- Voting ---

export async function submitVote(
  sessionId: string,
  phraseId: string,
  vote: SourceType,
  wasCorrect: boolean
): Promise<void> {
  await supabase.from("votes").insert({
    session_id: sessionId,
    phrase_id: phraseId,
    vote,
    was_correct: wasCorrect,
  });
}

export async function fetchPhraseStats(
  phraseId: string
): Promise<PhraseVoteStats | null> {
  const { data } = await supabase
    .from("phrase_vote_stats")
    .select("*")
    .eq("phrase_id", phraseId)
    .single();

  return (data as PhraseVoteStats) || null;
}

// --- Helpers ---

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function getRoundLength(): number {
  return ROUND_LENGTH;
}
