"use client";

import type { Phrase, SourceType } from "@/lib/types";

interface Props {
  phrase: Phrase;
  currentIndex: number;
  totalPhrases: number;
  accuracy: number;
  onVote: (vote: SourceType) => void;
  disabled: boolean;
}

export default function PhraseCard({
  phrase,
  currentIndex,
  totalPhrases,
  accuracy,
  onVote,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {/* Top bar: progress + accuracy */}
      <div className="fixed top-0 left-0 right-0 px-6 py-4 flex justify-between items-center">
        <span className="text-xs text-[var(--fg-muted)]">
          {currentIndex + 1} / {totalPhrases}
        </span>
        {currentIndex > 0 && (
          <span className="text-xs text-[var(--fg-muted)]">
            {accuracy}% correct
          </span>
        )}
      </div>

      {/* Phrase */}
      <div className="max-w-lg w-full text-center">
        <p className="font-serif text-2xl sm:text-3xl leading-relaxed">
          {phrase.text}
        </p>
      </div>

      {/* Vote buttons */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-6">
        <div className="flex gap-4 max-w-md mx-auto">
          <button
            onClick={() => onVote("human")}
            disabled={disabled}
            className="flex-1 py-4 rounded-xl border-2 border-[var(--border)]
              text-lg font-medium
              hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]
              active:scale-[0.98] transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Human
          </button>
          <button
            onClick={() => onVote("ai")}
            disabled={disabled}
            className="flex-1 py-4 rounded-xl border-2 border-[var(--border)]
              text-lg font-medium
              hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]
              active:scale-[0.98] transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            AI
          </button>
        </div>
      </div>
    </div>
  );
}
