import { useEffect, useState, useCallback } from "react";

const KEY = "hoai_theme";
type Theme = "dark" | "light";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && window.localStorage.getItem(KEY)) as Theme | null;
    const initial: Theme = stored ?? "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
