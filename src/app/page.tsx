"use client";

import { useState, useEffect, useCallback } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Onboarding from "@/components/Onboarding";
import PhraseCard from "@/components/PhraseCard";
import RevealCard from "@/components/RevealCard";
import EndScreen from "@/components/EndScreen";
import {
  getOrCreateSession,
  updateSessionDemographics,
  fetchRoundPhrases,
  submitVote,
  submitAnnotation,
  fetchPhraseStats,
} from "@/lib/game";
import type {
  Session,
  Phrase,
  SourceType,
  AgeBucket,
  PrimaryRegister,
  PhraseVoteStats,
} from "@/lib/types";

type Screen = "loading" | "onboarding" | "playing" | "reveal" | "end";

interface VoteRecord {
  phrase: Phrase;
  vote: SourceType;
  wasCorrect: boolean;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voteHistory, setVoteHistory] = useState<VoteRecord[]>([]);
  const [lastVote, setLastVote] = useState<SourceType | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastStats, setLastStats] = useState<PhraseVoteStats | null>(null);
  const [lastVoteId, setLastVoteId] = useState<string | null>(null);
  const [voteLocked, setVoteLocked] = useState(false);
  const [streak, setStreak] = useState(0);

  // Init session
  useEffect(() => {
    async function init() {
      try {
        const s = await getOrCreateSession();
        setSession(s);
        if (s.age_bucket || s.primary_register) {
          await startRound(s.id);
        } else {
          setScreen("onboarding");
        }
      } catch {
        setScreen("onboarding");
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startRound = useCallback(async (sessionId: string) => {
    setScreen("loading");
    const round = await fetchRoundPhrases(sessionId);
    setPhrases(round);
    setCurrentIndex(0);
    setVoteHistory([]);
    setLastVote(null);
    setLastCorrect(false);
    setLastStats(null);
    setLastVoteId(null);
    setVoteLocked(false);
    setStreak(0);
    if (round.length > 0) {
      setScreen("playing");
    }
  }, []);

  const accuracy =
    voteHistory.length > 0
      ? Math.round(
          (voteHistory.filter((v) => v.wasCorrect).length / voteHistory.length) *
            100
        )
      : 0;

  async function handleOnboardingComplete(
    age: AgeBucket | null,
    register: PrimaryRegister | null
  ) {
    let s = session;
    if (!s) {
      try {
        s = await getOrCreateSession();
        setSession(s);
      } catch {
        return;
      }
    }
    if (age || register) {
      await updateSessionDemographics(s.id, age, register);
    }
    await startRound(s.id);
  }

  async function handleVote(vote: SourceType) {
    if (voteLocked || !session || !phrases[currentIndex]) return;
    setVoteLocked(true);

    const phrase = phrases[currentIndex];
    const wasCorrect = vote === phrase.source_type;

    // Submit to Supabase, get vote ID back
    const voteId = await submitVote(session.id, phrase.id, vote, wasCorrect);

    // Fetch community stats
    const stats = await fetchPhraseStats(phrase.id);

    const record: VoteRecord = { phrase, vote, wasCorrect };
    setVoteHistory((prev) => [...prev, record]);
    setLastVote(vote);
    setLastCorrect(wasCorrect);
    setLastStats(stats);
    setLastVoteId(voteId);
    setStreak((prev) => (wasCorrect ? prev + 1 : 0));
    setScreen("reveal");
  }

  function advanceToNext() {
    if (currentIndex + 1 >= phrases.length) {
      setScreen("end");
    } else {
      setCurrentIndex((i) => i + 1);
      setVoteLocked(false);
      setScreen("playing");
    }
  }

  async function handleRevealSave(wordIndices: number[], freeText: string | null) {
    if (lastVoteId && session && phrases[currentIndex]) {
      await submitAnnotation(
        lastVoteId,
        session.id,
        phrases[currentIndex].id,
        wordIndices,
        freeText
      );
    }
    advanceToNext();
  }

  function handleRevealSkip() {
    advanceToNext();
  }

  async function handlePlayAgain() {
    if (!session) return;
    await startRound(session.id);
  }

  return (
    <main>
      <ThemeToggle />

      {screen === "loading" && (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[var(--fg-muted)] text-sm">Loading...</p>
        </div>
      )}

      {screen === "onboarding" && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {screen === "playing" && phrases[currentIndex] && (
        <PhraseCard
          phrase={phrases[currentIndex]}
          currentIndex={currentIndex}
          totalPhrases={phrases.length}
          accuracy={accuracy}
          onVote={handleVote}
          disabled={voteLocked}
        />
      )}

      {screen === "reveal" && phrases[currentIndex] && lastVote && (
        <RevealCard
          phrase={phrases[currentIndex]}
          userVote={lastVote}
          wasCorrect={lastCorrect}
          stats={lastStats}
          currentIndex={currentIndex}
          totalPhrases={phrases.length}
          accuracy={accuracy}
          streak={streak}
          onSave={handleRevealSave}
          onSkip={handleRevealSkip}
        />
      )}

      {screen === "end" && (
        <EndScreen votes={voteHistory} onPlayAgain={handlePlayAgain} />
      )}
    </main>
  );
}
