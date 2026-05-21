"use client";

import { useState } from "react";
import type { AgeBucket, PrimaryRegister } from "@/lib/types";

interface Props {
  onComplete: (age: AgeBucket | null, register: PrimaryRegister | null) => void;
}

const AGE_OPTIONS: { value: AgeBucket; label: string }[] = [
  { value: "under_25", label: "Under 25" },
  { value: "25_to_40", label: "25-40" },
  { value: "40_to_60", label: "40-60" },
  { value: "60_plus", label: "60+" },
];

const REGISTER_OPTIONS: { value: PrimaryRegister; label: string }[] = [
  { value: "academic", label: "Academic" },
  { value: "business", label: "Business" },
  { value: "journalism", label: "Journalism" },
  { value: "marketing", label: "Marketing" },
  { value: "creative", label: "Creative" },
  { value: "casual", label: "Casual" },
  { value: "other", label: "Other" },
];

export default function Onboarding({ onComplete }: Props) {
  const [age, setAge] = useState<AgeBucket | null>(null);
  const [register, setRegister] = useState<PrimaryRegister | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-serif text-3xl font-semibold">Human or AI?</h1>
          <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
            Want to log a few demographics so we can show you how you compare?
            Totally optional.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">
              Age range
            </label>
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAge(age === opt.value ? null : opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    age === opt.value
                      ? "border-[var(--accent-blue)] text-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                      : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">
              Primary writing register
            </label>
            <div className="flex flex-wrap gap-2">
              {REGISTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setRegister(register === opt.value ? null : opt.value)
                  }
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    register === opt.value
                      ? "border-[var(--accent-blue)] text-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                      : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => onComplete(null, null)}
            className="flex-1 py-3 rounded-lg border border-[var(--border)]
              text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors text-sm"
          >
            Skip
          </button>
          <button
            onClick={() => onComplete(age, register)}
            className="flex-1 py-3 rounded-lg border border-[var(--border)]
              text-[var(--fg)] hover:border-[var(--fg-muted)] transition-colors text-sm"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
