"use client";

import type { Phrase, SourceType, PhraseVoteStats } from "@/lib/types";

interface Props {
  phrase: Phrase;
  userVote: SourceType;
  wasCorrect: boolean;
  stats: PhraseVoteStats | null;
  currentIndex: number;
  totalPhrases: number;
  accuracy: number;
}

export default function RevealCard({
  phrase,
  userVote,
  wasCorrect,
  stats,
  currentIndex,
  totalPhrases,
  accuracy,
}: Props) {
  const totalVotes = stats?.total_votes || 0;
  const humanPct =
    totalVotes > 0 ? Math.round(((stats?.votes_human || 0) / totalVotes) * 100) : 50;
  const aiPct = 100 - humanPct;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 px-6 py-4 flex justify-between items-center">
        <span className="text-xs text-[var(--fg-muted)]">
          {currentIndex + 1} / {totalPhrases}
        </span>
        <span className="text-xs text-[var(--fg-muted)]">
          {accuracy}% correct
        </span>
      </div>

      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Phrase */}
        <p className="font-serif text-2xl sm:text-3xl leading-relaxed">
          {phrase.text}
        </p>

        {/* Result badge */}
        <div className="flex justify-center">
          <span
            className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
              wasCorrect
                ? "bg-[var(--accent-green)]/15 text-[var(--accent-green)]"
                : "bg-[var(--accent-red)]/15 text-[var(--accent-red)]"
            }`}
          >
            {wasCorrect ? "Correct" : "Wrong"} - written by{" "}
            {phrase.source_type === "human" ? "a human" : "AI"}
          </span>
        </div>

        {/* Community split bars */}
        {totalVotes > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--fg-muted)]">
              Community vote ({totalVotes} votes)
            </p>
            <div className="flex h-8 rounded-lg overflow-hidden border border-[var(--border)]">
              <div
                className="flex items-center justify-center text-xs font-medium transition-all duration-500"
                style={{
                  width: `${humanPct}%`,
                  backgroundColor:
                    phrase.source_type === "human"
                      ? "var(--accent-green)"
                      : "var(--accent-red)",
                  opacity: 0.7,
                }}
              >
                {humanPct > 10 && `Human ${humanPct}%`}
              </div>
              <div
                className="flex items-center justify-center text-xs font-medium transition-all duration-500"
                style={{
                  width: `${aiPct}%`,
                  backgroundColor:
                    phrase.source_type === "ai"
                      ? "var(--accent-green)"
                      : "var(--accent-red)",
                  opacity: 0.7,
                }}
              >
                {aiPct > 10 && `AI ${aiPct}%`}
              </div>
            </div>
          </div>
        )}

        {/* What you picked */}
        <div className="flex justify-center gap-4">
          <div
            className={`px-4 py-2 rounded-lg text-sm border-2 ${
              userVote === "human"
                ? wasCorrect && phrase.source_type === "human"
                  ? "border-[var(--accent-green)] text-[var(--accent-green)]"
                  : "border-[var(--accent-red)] text-[var(--accent-red)]"
                : "border-[var(--border)] text-[var(--fg-muted)]"
            }`}
          >
            Human
          </div>
          <div
            className={`px-4 py-2 rounded-lg text-sm border-2 ${
              userVote === "ai"
                ? wasCorrect && phrase.source_type === "ai"
                  ? "border-[var(--accent-green)] text-[var(--accent-green)]"
                  : "border-[var(--accent-red)] text-[var(--accent-red)]"
                : "border-[var(--border)] text-[var(--fg-muted)]"
            }`}
          >
            AI
          </div>
        </div>
      </div>
    </div>
  );
}
