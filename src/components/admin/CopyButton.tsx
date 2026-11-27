"use client";

import { useState } from "react";

/** Menyalin teks ke papan klip, dengan umpan balik singkat. */
export default function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-light btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt("Salin teks ini:", text);
        }
      }}
    >
      {done ? "Tersalin ✓" : label}
    </button>
  );
}
