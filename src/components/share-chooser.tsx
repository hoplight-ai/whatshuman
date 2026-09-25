import { useEffect, useState } from "react";
import { Linkedin, Twitter, AtSign, Link2, Share2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  accuracy: number;
  maxStreak: number;
  /** Called when the user picks LinkedIn — parent may want to attach the PNG. */
  onLinkedIn: () => void | Promise<void>;
}

const SITE_URL = "https://whatshuman.lovable.app";

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function ShareChooser({ open, onClose, accuracy, maxStreak, onLinkedIn }: Props) {
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function" && isMobile());
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const fullText = `I scored ${accuracy}% on Human or AI? Best streak: ${maxStreak}. Can you beat it? ${SITE_URL}`;
  const copyText = `I scored ${accuracy}% on Human or AI? ${SITE_URL}`;

  function openWindow(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleLinkedIn() {
    try {
      await onLinkedIn();
    } catch (e) {
      console.error("[share] LinkedIn PNG step failed:", e);
    }
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}&summary=${encodeURIComponent(fullText)}`;
    openWindow(url);
    onClose();
  }

  function handleTwitter() {
    const text = `${fullText} #HumanOrAI`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_URL)}`;
    openWindow(url);
    onClose();
  }

  function handleThreads() {
    const text = `${fullText} #HumanOrAI`;
    const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
    openWindow(url);
    onClose();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText);
      toast("Copied!", { duration: 1500 });
    } catch (e) {
      console.error("[share] copy failed:", e);
      toast.error("Couldn't copy to clipboard");
    }
    onClose();
  }

  async function handleNative() {
    try {
      await navigator.share({
        title: "Human or AI?",
        text: fullText,
        url: SITE_URL,
      });
    } catch (e) {
      // User cancelled or share failed — silent
      console.debug("[share] native share dismissed:", e);
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-2 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share your result"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-sm font-medium text-foreground">Share your result</div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col">
          <ShareRow icon={<Linkedin size={20} />} label="LinkedIn" onClick={handleLinkedIn} />
          <ShareRow icon={<Twitter size={20} />} label="Twitter / X" onClick={handleTwitter} />
          <ShareRow icon={<AtSign size={20} />} label="Threads" onClick={handleThreads} />
          <ShareRow icon={<Link2 size={20} />} label="Copy link" onClick={handleCopy} />
          {canNativeShare && (
            <ShareRow icon={<Share2 size={20} />} label="More…" onClick={handleNative} />
          )}
        </div>
      </div>
    </div>
  );
}

function ShareRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-foreground hover:bg-accent"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
