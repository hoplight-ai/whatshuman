// The card that shows up when this link is pasted into a message.
//
// The app had none. `openGraph.title` and `openGraph.description` were set, so an unfurler had
// words to show and nothing to show them next to — a bare text bubble with no picture, which is
// exactly what a link to a party game must not look like when it is being shared into a group
// chat. That is the whole distribution channel for this thing.
//
// The twitter card was also `summary`, the small square variant, so even once an image existed it
// would have rendered as a thumbnail. layout.tsx now asks for summary_large_image.
//
// Generated rather than committed as a PNG so it cannot drift from the palette in globals.css.
// Satori renders it at build time: no network, no font files, nothing for the build to depend on.

import { ImageResponse } from "next/og";
import HumanAiMark from "@/components/HumanAiMark";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Human or AI? — a perception game for the LLM era";

// Straight off src/app/globals.css. No new palette decision is made here.
const GROUND = "#0d1117";
const SURFACE = "#161b22";
const LINE = "#30363d";
const TEXT = "#f0f6fc";
const MUTED = "#8b949e";
const HUMAN = "#3fb950";
const AI = "#58a6ff";

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: SURFACE,
        border: `3px solid ${color}`,
        borderRadius: 999,
        color,
        fontSize: 34,
        fontWeight: 700,
        letterSpacing: 2,
        padding: "14px 40px",
      }}
    >
      {label}
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: GROUND,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          // Satori has no default font stack of its own to fall back through, so name one.
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <HumanAiMark size={104} />
          <div style={{ color: TEXT, fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
            Human or AI?
          </div>
        </div>

        <div style={{ display: "flex", color: MUTED, fontSize: 40, marginTop: 26 }}>
          A perception game for the LLM era.
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 52 }}>
          <Chip label="HUMAN" color={HUMAN} />
          <Chip label="AI" color={AI} />
        </div>

        {/* A rule and the line "Vote on short phrases and see how you compare with the room" used
            to sit here. Deleted 2026-08-28: og:description is the same sentence, and every client
            that shows this picture prints that sentence in grey directly beneath it. The card was
            spending its bottom third repeating the caption it ships with. */}
      </div>
    ),
    size
  );
}
