"use client";

import type { Phrase, SourceType } from "@/lib/types";

interface VoteRecord {
  phrase: Phrase;
  vote: SourceType;
  wasCorrect: boolean;
}

interface Props {
  votes: VoteRecord[];
  onPlayAgain: () => void;
}

export default function EndScreen({ votes, onPlayAgain }: Props) {
  const total = votes.length;
  const correct = votes.filter((v) => v.wasCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Breakdown by register
  const byRegister = new Map<string, { correct: number; total: number }>();
  for (const v of votes) {
    const r = v.phrase.register;
    const existing = byRegister.get(r) || { correct: 0, total: 0 };
    existing.total++;
    if (v.wasCorrect) existing.correct++;
    byRegister.set(r, existing);
  }

  // Breakdown by word count bucket
  const shortRange = { label: "4-10 words", correct: 0, total: 0 };
  const longRange = { label: "11-25 words", correct: 0, total: 0 };
  for (const v of votes) {
    const bucket = v.phrase.word_count <= 10 ? shortRange : longRange;
    bucket.total++;
    if (v.wasCorrect) bucket.correct++;
  }

  const shareText = encodeURIComponent(
    `I scored ${accuracy}% on Human or AI? - can you do better? https://whatshuman.vercel.app`
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="max-w-md w-full space-y-10 text-center">
        {/* Big score */}
        <div className="space-y-2">
          <p className="text-7xl font-serif font-semibold">{accuracy}%</p>
          <p className="text-[var(--fg-muted)] text-sm">
            {correct} of {total} correct
          </p>
        </div>

        {/* Word count breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">
            By phrase length
          </h3>
          <div className="flex justify-center gap-6">
            {[shortRange, longRange].map(
              (b) =>
                b.total > 0 && (
                  <div key={b.label} className="text-center">
                    <p className="text-lg font-medium">
                      {Math.round((b.correct / b.total) * 100)}%
                    </p>
                    <p className="text-xs text-[var(--fg-muted)]">{b.label}</p>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Register breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">
            By register
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Array.from(byRegister.entries())
              .sort((a, b) => b[1].total - a[1].total)
              .map(([register, data]) => (
                <div
                  key={register}
                  className="flex justify-between px-3 py-2 rounded-lg bg-[var(--bg-card)]"
                >
                  <span className="text-[var(--fg-muted)]">
                    {register.replace(/_/g, " ")}
                  </span>
                  <span>
                    {data.correct}/{data.total}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=https://whatshuman.vercel.app&title=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl border-2 border-[var(--accent-blue)]
              text-[var(--accent-blue)] text-sm font-medium
              hover:bg-[var(--accent-blue)]/10 transition-colors"
          >
            Share on LinkedIn
          </a>
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-xl border-2 border-[var(--border)]
              text-[var(--fg-muted)] text-sm font-medium
              hover:border-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  );
}
