interface Props {
  keyLetters: string[];
  ranks: number[];
  readingOrder: number[];
}

export function KeyRanking({ keyLetters, ranks, readingOrder }: Props) {
  if (!ranks.length) return null;

  const alphabetical = [...keyLetters.keys()].sort((a, b) => ranks[a] - ranks[b]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
        Alphabetical order
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 font-mono">
        {alphabetical.map((col, i) => (
          <span key={col} className="flex items-center gap-1.5">
            <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/10">
              {keyLetters[col]}
            </span>
            {i < alphabetical.length - 1 && <span className="text-slate-400 dark:text-gray-500">→</span>}
          </span>
        ))}
      </div>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
        Column reading order
      </div>
      <div className="flex flex-wrap items-center gap-1.5 font-mono">
        {readingOrder.map((col, i) => (
          <span key={col} className="flex items-center gap-1.5">
            <span className="rounded-md bg-indigo-600 px-2 py-0.5 font-semibold text-white shadow-sm">
              {col + 1}
            </span>
            {i < readingOrder.length - 1 && <span className="text-slate-400 dark:text-gray-500">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
