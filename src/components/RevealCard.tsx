"use client";

import { useState } from "react";
import type { Phrase, SourceType, PhraseVoteStats } from "@/lib/types";
import Confetti from "./Confetti";

interface Props {
  phrase: Phrase;
  userVote: SourceType;
  wasCorrect: boolean;
  stats: PhraseVoteStats | null;
  currentIndex: number;
  totalPhrases: number;
  accuracy: number;
  streak: number;
  onSave: (wordIndices: number[], freeText: string | null) => void;
  onSkip: () => void;
}

export default function RevealCard({
  phrase,
  userVote,
  wasCorrect,
  stats,
  currentIndex,
  totalPhrases,
  accuracy,
  streak,
  onSave,
  onSkip,
}: Props) {
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [freeText, setFreeText] = useState("");

  const totalVotes = stats?.total_votes || 0;
  const humanPct =
    totalVotes > 0
      ? Math.round(((stats?.votes_human || 0) / totalVotes) * 100)
      : 50;
  const aiPct = 100 - humanPct;

  const words = phrase.text.replace(/^[""“]+|[""”]+$/g, "").split(/\s+/);

  function toggleWord(index: number) {
    setSelectedWords((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleSave() {
    onSave(
      Array.from(selectedWords).sort((a, b) => a - b),
      freeText.trim() || null
    );
  }

  const voteCountText =
    totalVotes === 0
      ? "You're among the first to vote on this one."
      : totalVotes === 1
        ? "1 vote from prior players"
        : `${totalVotes} votes from prior players`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {wasCorrect && <Confetti />}

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 px-6 py-4 flex justify-between items-center">
        <span className="text-xs text-[var(--fg-muted)]">
          {currentIndex + 1} / {totalPhrases}
        </span>
        <div className="flex gap-4">
          <span className="text-xs text-[var(--fg-muted)]">
            Accuracy <span className="font-semibold text-[var(--fg)]">{accuracy}%</span>
          </span>
          <span className="text-xs text-[var(--fg-muted)]">
            Streak <span className="font-semibold text-[var(--fg)]">{streak}</span>
          </span>
        </div>
      </div>

      <div className="max-w-lg w-full space-y-6">
        {/* Phrase */}
        <p className="font-serif text-2xl sm:text-3xl leading-relaxed text-center">
          &ldquo;{phrase.text}&rdquo;
        </p>

        {/* Result badge */}
        <div className="flex items-center justify-center gap-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              wasCorrect
                ? "bg-[var(--accent-green)] text-white"
                : "bg-[var(--accent-red)] text-white"
            }`}
          >
            {wasCorrect ? "Correct" : "Wrong"}
          </span>
          <span className="text-sm text-[var(--fg-muted)]">
            Actually {phrase.source_type === "human" ? "Human" : "AI"}
          </span>
        </div>

        {/* Community vote bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--fg-muted)] w-14">Human</span>
            <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${humanPct}%`,
                  backgroundColor: "var(--accent-red)",
                }}
              />
            </div>
            <span className="text-sm text-[var(--fg-muted)] w-10 text-right">{humanPct}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--fg-muted)] w-14">AI</span>
            <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${aiPct}%`,
                  backgroundColor: "var(--accent-blue)",
                }}
              />
            </div>
            <span className="text-sm text-[var(--fg-muted)] w-10 text-right">{aiPct}%</span>
          </div>
          <p className="text-xs text-[var(--fg-muted)]">{voteCountText}</p>
        </div>

        {/* Word tap annotation */}
        <div className="space-y-3">
          <p className="text-sm font-medium" style={{ color: "var(--accent-blue)" }}>
            Which words tipped you off? Tap any word.
          </p>
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-lg leading-relaxed">
            {words.map((word, i) => (
              <button
                key={i}
                onClick={() => toggleWord(i)}
                className={`px-1 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedWords.has(i)
                    ? "bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] font-medium"
                    : "text-[var(--fg)] hover:bg-[var(--border)]/50"
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* Free text feedback */}
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: "var(--accent-blue)" }}>
            Anything else? (optional)
          </p>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value.slice(0, 500))}
            placeholder="What stood out?"
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg)] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[var(--accent-blue)]"
          />
          <p className="text-xs text-[var(--fg-muted)] text-right">{freeText.length}/500</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={onSkip}
            className="flex-1 py-3 rounded-full border border-[var(--border)] text-[var(--fg)] text-sm font-medium hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Save &amp; continue
          </button>
        </div>
      </div>
    </div>
  );
}
