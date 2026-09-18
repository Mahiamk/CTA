import type { Operation } from "../types/cipher";

interface Props {
  text: string;
  keyValue: string;
  operation: Operation;
  isLoading: boolean;
  error: string | null;
  onTextChange: (value: string) => void;
  onKeyChange: (value: string) => void;
  onSubmit: (operation: Operation) => void;
  onReset: () => void;
}

export function CipherInput({
  text,
  keyValue,
  operation,
  isLoading,
  error,
  onTextChange,
  onKeyChange,
  onSubmit,
  onReset,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="plaintext" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
            {operation === "encrypt" ? "Plaintext" : "Ciphertext"}
          </label>
          <textarea
            id="plaintext"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={2}
            placeholder="WEAREDISCOVEREDFLEEATONCE"
            className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-sm tracking-wide text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="key" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
            Key
          </label>
          <input
            id="key"
            type="text"
            value={keyValue}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder="ZEBRAS"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-sm tracking-wide text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => onSubmit("encrypt")}
          disabled={isLoading}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && operation === "encrypt" ? "Encrypting…" : "Encrypt"}
        </button>
        <button
          onClick={() => onSubmit("decrypt")}
          disabled={isLoading}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15"
        >
          {isLoading && operation === "decrypt" ? "Decrypting…" : "Decrypt"}
        </button>
        <button
          onClick={onReset}
          disabled={isLoading}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/10"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
