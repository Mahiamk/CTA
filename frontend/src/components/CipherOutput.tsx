import { useState } from "react";
import type { Operation } from "../types/cipher";

interface Props {
  result: string | null;
  operation: Operation;
  charactersProcessed: number;
  columnsRead: number;
  rowsProcessed: number;
}

export function CipherOutput({ result, operation, charactersProcessed, columnsRead, rowsProcessed }: Props) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          {operation === "encrypt" ? "Final Ciphertext" : "Recovered Plaintext"}
        </span>
        <button
          onClick={handleCopy}
          className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-black/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white px-4 py-3 font-mono text-lg font-bold tracking-widest text-slate-900 shadow-inner dark:bg-black/30 dark:text-white">
        {result.split("").map((ch, i) => (
          <span
            key={i}
            className="inline-block animate-[fadeIn_0.3s_ease-out_backwards]"
            style={{ animationDelay: `${Math.min(i * 15, 600)}ms` }}
          >
            {ch}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-emerald-800 dark:text-emerald-300">
        <span>Characters processed: <strong>{charactersProcessed}</strong></span>
        <span>Columns read: <strong>{columnsRead}</strong></span>
        <span>Rows processed: <strong>{rowsProcessed}</strong></span>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
