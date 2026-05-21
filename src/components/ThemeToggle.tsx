"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  return (
    <button
      onClick={() => setLight(!light)}
      className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full
        bg-[var(--bg-card)] border border-[var(--border)]
        flex items-center justify-center
        text-[var(--fg-muted)] hover:text-[var(--fg)]
        transition-colors text-sm"
      aria-label="Toggle light mode"
    >
      {light ? "D" : "L"}
    </button>
  );
}
