// The app's mark: one circle split down the middle, green half and blue half.
//
// WHY A SHAPE AND NOT LETTERS. This ends up as a 40px tile on a phone home screen, where type at
// that size is a smudge and a shape is not — the same reasoning the rest of the portfolio uses for
// its icons. The two halves are the two answers the whole game is about, in the two colours the app
// already uses for them, so the icon says what the app does without a word on it.
//
// Rendered by Satori inside next/og, which supports a subset of CSS: every div that has more than
// one child gets an explicit `display: flex`, and nothing here relies on a property Satori drops.

export default function HumanAiMark({ size }: { size: number }) {
  // The seam has to be visible at 40px or the two halves read as one muddy disc.
  const seam = Math.max(2, Math.round(size * 0.035));
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Human. */}
      <div style={{ width: (size - seam) / 2, height: size, background: "#3fb950" }} />
      <div style={{ width: seam, height: size, background: "#0d1117" }} />
      {/* AI. */}
      <div style={{ width: (size - seam) / 2, height: size, background: "#58a6ff" }} />
    </div>
  );
}
