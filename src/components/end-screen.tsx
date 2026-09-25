import { forwardRef, useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { Phrase, Register, SourceType } from "@/lib/supabase";
import { lookupTell } from "@/lib/tells";
import { ShareChooser } from "@/components/share-chooser";
import { SignupModal } from "@/components/signup-modal";

export interface VoteLog {
  phrase: Phrase;
  vote: SourceType;
  correct: boolean;
}

interface Props {
  votes: VoteLog[];
  maxStreak: number;
  nextRoundNumber: number;
  nextRoundLength: number;
  isMaxRound: boolean;
  onPlayAgain: () => void;
  prevAccuracy: number | null;
  roundNumber: number;
  isAuthenticated: boolean;
}

interface Band {
  label: string;
  sub: string;
  // Tailwind classes for accent (text + soft bg)
  accentText: string;
  accentBg: string;
  // Hex used in the share PNG (since html2canvas can't read CSS vars reliably)
  pngAccent: string;
}

function getBand(accuracy: number): Band {
  if (accuracy >= 75)
    return {
      label: "Sharp ear",
      sub: "You're reading the seams. Most players miss what you caught.",
      accentText: "text-cyan-600 dark:text-cyan-400",
      accentBg: "bg-cyan-500/10 border-cyan-500/30",
      pngAccent: "#0891b2",
    };
  if (accuracy >= 60)
    return {
      label: "Catching the rhythm",
      sub: "You're picking up the patterns AI doesn't know it's making.",
      accentText: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10 border-emerald-500/30",
      pngAccent: "#059669",
    };
  if (accuracy >= 45)
    return {
      label: "Tuning in",
      sub: "The signal is starting to surface for you. Keep going.",
      accentText: "text-foreground",
      accentBg: "bg-muted/60 border-border",
      pngAccent: "#475569",
    };
  if (accuracy >= 30)
    return {
      label: "AI ran circles",
      sub: "AI is sneaky here. The taxonomy is learnable. Round 2 changes the math.",
      accentText: "text-amber-600 dark:text-amber-400",
      accentBg: "bg-amber-500/10 border-amber-500/30",
      pngAccent: "#d97706",
    };
  return {
    label: "First contact",
    sub: "Every reader starts here. Pattern recognition builds with reps.",
    accentText: "text-stone-500 dark:text-stone-300",
    accentBg: "bg-stone-500/10 border-stone-500/30",
    pngAccent: "#78716c",
  };
}

function normalizeTellsPresent(input: string[] | string | null | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((s) => typeof s === "string" && s.length > 0);
  if (typeof input === "string") {
    const stripped = input.trim().replace(/^\{|\}$/g, "");
    return stripped ? stripped.split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean) : [];
  }
  return [];
}

function biggestTrick(votes: VoteLog[]): { id: string; name: string; count: number } | null {
  const wrong = votes.filter((v) => !v.correct);
  const counts = new Map<string, number>();
  for (const v of wrong) {
    for (const t of normalizeTellsPresent(v.phrase.tells_present)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [topId, topCount] = sorted[0];
  // Tie at 1: no clear winner
  if (topCount <= 1 && sorted.length > 1 && sorted[1][1] === topCount) return null;
  if (topCount < 1) return null;
  return { id: topId, name: lookupTell(topId).name, count: topCount };
}

export function EndScreen({
  votes,
  maxStreak,
  nextRoundNumber,
  nextRoundLength,
  isMaxRound,
  onPlayAgain,
  prevAccuracy,
  roundNumber,
  isAuthenticated,
}: Props) {
  const total = votes.length;
  const correct = votes.filter((v) => v.correct).length;
  const wrong = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const band = getBand(accuracy);

  const registerBreakdown = breakdownBy(votes, (v) => v.phrase.register ?? "unknown");
  const wcBreakdown = breakdownBy(votes, (v) => (v.phrase.word_count <= 10 ? "4-10 words" : "11-25 words"));

  const trick = biggestTrick(votes);
  const showAnchor = prevAccuracy !== null && roundNumber > 1;
  const accuracyDelta = showAnchor ? accuracy - (prevAccuracy as number) : 0;

  // Skill micro-badge: highest-accuracy register at >=80% with >=3 phrases
  const aced = registerBreakdown
    .filter((r) => r.hits + r.misses >= 3 && r.hits / (r.hits + r.misses) >= 0.8)
    .sort((a, b) => b.hits / (b.hits + b.misses) - a.hits / (a.hits + a.misses))[0];

  const shareCardRef = useRef<HTMLDivElement>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  // Generate the result PNG and trigger a download so the user can attach it
  // to LinkedIn (LinkedIn's share-offsite endpoint can't accept the image directly).
  async function generateLinkedInPng(): Promise<void> {
    if (!shareCardRef.current) return;
    const canvas = await html2canvas(shareCardRef.current, {
      backgroundColor: "#0b0f17",
      scale: 2,
      useCORS: true,
    });
    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `human-or-ai-${accuracy}pct.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      }, "image/png");
    });
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-10 fade-in">
      <h1 className="font-serif text-2xl text-foreground">Round complete</h1>

      {/* Headline card */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <div className="font-serif text-2xl leading-tight text-foreground sm:text-3xl">
            AI fooled you{" "}
            <span className="font-semibold text-rose-500/90 dark:text-rose-400/90">{wrong}</span> times.
          </div>
          <div className="font-serif text-2xl leading-tight text-foreground sm:text-3xl">
            You caught it{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{correct}</span> times.
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {accuracy}% accuracy · {total} phrases
        </div>

        {/* Performance band */}
        <div className={`mt-5 rounded-xl border px-4 py-3 ${band.accentBg}`}>
          <div className={`text-sm font-semibold ${band.accentText}`}>{band.label}</div>
          <div className="mt-1 text-sm text-muted-foreground">{band.sub}</div>
        </div>
      </div>

      {/* Personal anchor */}
      {showAnchor && (
        <div className="mt-4 rounded-xl border border-border bg-card/60 p-4 text-sm">
          <div className="text-muted-foreground">
            Last round: <span className="font-medium text-foreground">{prevAccuracy}%</span>. This round:{" "}
            <span className="font-medium text-foreground">{accuracy}%</span>.
          </div>
          {accuracyDelta > 0 ? (
            <div className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">↑ catching more</div>
          ) : accuracyDelta < 0 ? (
            <div className="mt-1 text-sm font-medium text-muted-foreground">→ keep at it</div>
          ) : (
            <div className="mt-1 text-sm font-medium text-muted-foreground">→ steady</div>
          )}
        </div>
      )}

      {/* AI's biggest trick */}
      <div className="mt-4 rounded-xl border border-border bg-card/60 p-4 text-sm">
        {trick ? (
          <div className="text-foreground">
            <span className="text-muted-foreground">AI's biggest trick on you this round: </span>
            <span className="font-medium">{trick.name}</span>
            <span className="text-muted-foreground">. You missed it {trick.count} times.</span>
          </div>
        ) : (
          <div className="text-foreground">Clean round — AI didn't have one go-to trick on you.</div>
        )}
      </div>

      {/* Best streak */}
      {maxStreak >= 5 && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:text-emerald-300 animate-pulse-soft">
          Best streak: {maxStreak} in a row.
        </div>
      )}

      {/* Skill micro-badge */}
      {aced && (
        <div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-center text-sm text-cyan-700 dark:text-cyan-300">
          Aced the <span className="font-medium capitalize">{aced.label}</span> register ({aced.hits}/
          {aced.hits + aced.misses}).
        </div>
      )}

      <Section title="By word count" rows={wcBreakdown} />
      <Section title="By register" rows={registerBreakdown} />

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          onClick={onPlayAgain}
          className="rounded-xl border border-border bg-background px-4 py-3 text-base font-medium text-foreground hover:bg-accent"
        >
          {isMaxRound ? `Play again (${nextRoundLength} phrases)` : `Round ${nextRoundNumber} (${nextRoundLength} phrases)`}
        </button>
        <button
          onClick={() => setChooserOpen(true)}
          className="rounded-xl border border-foreground bg-foreground px-4 py-3 text-base font-medium text-background hover:opacity-90"
        >
          Share
        </button>
      </div>

      {/* Off-screen share card rendered to PNG */}
      <div className="pointer-events-none fixed -left-[9999px] top-0">
        <ShareCard
          ref={shareCardRef}
          wrong={wrong}
          correct={correct}
          accuracy={accuracy}
          band={band}
          maxStreak={maxStreak}
        />
      </div>

      <ShareChooser
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        accuracy={accuracy}
        maxStreak={maxStreak}
        onLinkedIn={generateLinkedInPng}
      />

      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
}

interface Row {
  label: string;
  hits: number;
  misses: number;
}

function breakdownBy(votes: VoteLog[], keyFn: (v: VoteLog) => string): Row[] {
  const map = new Map<string, Row>();
  for (const v of votes) {
    const k = keyFn(v);
    const row = map.get(k) ?? { label: k, hits: 0, misses: 0 };
    if (v.correct) row.hits++;
    else row.misses++;
    map.set(k, row);
  }
  return Array.from(map.values()).sort((a, b) => b.hits + b.misses - (a.hits + a.misses));
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Group</th>
              <th className="border-l border-border px-3 py-2 text-right font-medium">Hits</th>
              <th className="border-l border-border px-3 py-2 text-right font-medium">Misses</th>
              <th className="border-l border-border px-3 py-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const t = r.hits + r.misses;
              const pct = t > 0 ? Math.round((r.hits / t) * 100) : 0;
              const zebra = i % 2 === 1 ? "bg-muted/30" : "";
              return (
                <tr key={r.label} className={`border-t border-border ${zebra}`}>
                  <td className="px-3 py-2 capitalize text-foreground">{r.label}</td>
                  <td className="border-l border-border px-3 py-2 text-right text-foreground">{r.hits}</td>
                  <td className="border-l border-border px-3 py-2 text-right text-foreground">{r.misses}</td>
                  <td className="border-l border-border px-3 py-2 text-right font-medium text-foreground">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----- Share card (off-screen, rendered to PNG) -----

interface ShareCardProps {
  wrong: number;
  correct: number;
  accuracy: number;
  band: Band;
  maxStreak: number;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { wrong, correct, accuracy, band, maxStreak },
  ref,
) {
  // Inline styles so html2canvas captures predictable colors regardless of theme/CSS vars.
  return (
    <div
      ref={ref}
      style={{
        width: "1200px",
        height: "630px",
        background: "linear-gradient(135deg, #0b0f17 0%, #131a2a 100%)",
        color: "#f5f7fa",
        padding: "64px",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.01em" }}>Human or AI?</div>
        <div style={{ fontSize: "20px", color: "#94a3b8" }}>whatshuman.lovable.app</div>
      </div>

      <div>
        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: "64px",
            lineHeight: 1.1,
            fontWeight: 500,
          }}
        >
          AI fooled me <span style={{ color: "#fb7185" }}>{wrong}</span> times.
        </div>
        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: "64px",
            lineHeight: 1.1,
            fontWeight: 500,
            marginTop: "12px",
          }}
        >
          I caught it <span style={{ color: "#34d399" }}>{correct}</span> times.
        </div>
        <div style={{ marginTop: "20px", fontSize: "24px", color: "#94a3b8" }}>{accuracy}% accuracy</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div
          style={{
            display: "inline-block",
            padding: "16px 24px",
            border: `2px solid ${band.pngAccent}`,
            borderRadius: "16px",
            background: `${band.pngAccent}22`,
          }}
        >
          <div style={{ fontSize: "26px", fontWeight: 600, color: band.pngAccent }}>{band.label}</div>
          <div style={{ marginTop: "6px", fontSize: "18px", color: "#cbd5e1", maxWidth: "560px" }}>{band.sub}</div>
        </div>
        {maxStreak >= 5 && (
          <div
            style={{
              padding: "12px 20px",
              border: "2px solid #34d399",
              borderRadius: "12px",
              background: "#34d39922",
              fontSize: "20px",
              fontWeight: 600,
              color: "#34d399",
            }}
          >
            Best streak: {maxStreak}
          </div>
        )}
      </div>
    </div>
  );
});

// Re-export types for convenience
export type { Register };
