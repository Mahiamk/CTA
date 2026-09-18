import type { Operation } from "../types/cipher";

interface Explanation {
  what: string;
  why: string;
}

const EXPLANATIONS: Record<string, Explanation> = {
  input: {
    what: "The raw plaintext (or ciphertext) and the key are captured as the starting inputs.",
    why: "Every subsequent step is a deterministic transformation of these two values — nothing else influences the result.",
  },
  normalize: {
    what: "The text is uppercased and any character that isn't a letter or digit (spaces, punctuation) is removed.",
    why: "A transposition grid has no concept of a 'space' — every cell must hold exactly one meaningful character.",
  },
  grid_created: {
    what: "An empty grid is sized with one column per key letter and enough rows to hold every character.",
    why: "Columnar transposition works by writing text into a rectangular grid and reading it back out in a different column order.",
  },
  place_character: {
    what: "Characters are inserted left-to-right, then wrap to the next row — filling the grid exactly like text filling a page.",
    why: "This row-major fill order is what the reading step later 'scrambles' by reading column-major instead.",
  },
  key_ranking: {
    what: "Each key letter is assigned a rank equal to its position in alphabetical order. Duplicate letters keep their original left-to-right order (a stable sort).",
    why: "The rank — not the letter itself — determines the order columns are read in. This is the secret the key encodes.",
  },
  read_column: {
    what: "Starting with rank 1, each column is read top-to-bottom and appended to the ciphertext.",
    why: "Reading columns out of their original left-to-right order is exactly what scrambles the plaintext into ciphertext.",
  },
  complete: {
    what: "Every column has been read (encrypting) or every row has been read (decrypting), producing the final result.",
    why: "The transposition is now complete — the same characters as the input, in a new order determined entirely by the key.",
  },
  grid_dimensions: {
    what: "The grid's row and column count are recalculated from the ciphertext length and key length.",
    why: "Decryption needs to rebuild the exact same grid shape encryption used, or the columns won't line up.",
  },
  column_lengths: {
    what: "Because the last row may be incomplete, some columns hold one more character than others — determined by column position.",
    why: "Without knowing exactly how many characters belong in each column, the ciphertext can't be sliced correctly.",
  },
  distribute_column: {
    what: "The ciphertext is sliced up and poured back into the grid, one column at a time, in ranked order.",
    why: "This exactly reverses the encryption read order: what was read out in rank order must be written back in rank order.",
  },
  read_row: {
    what: "With the grid fully reconstructed, rows are read left-to-right, top-to-bottom.",
    why: "Reading row-major recovers the original fill order from encryption, revealing the plaintext.",
  },
};

interface Props {
  stepType: string;
  description: string;
  operation: Operation;
}

export function AlgorithmExplanation({ stepType, description, operation }: Props) {
  const explanation = EXPLANATIONS[stepType];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="mb-4 text-sm leading-relaxed text-slate-700 dark:text-gray-200">{description}</p>

      {explanation && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white">
              What is happening?
            </div>
            <p className="text-sm text-slate-600 dark:text-gray-400">{explanation.what}</p>
          </div>
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white">
              Why?
            </div>
            <p className="text-sm text-slate-600 dark:text-gray-400">{explanation.why}</p>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-gray-400">
        <span className="font-semibold text-slate-600 dark:text-gray-300">Complexity — </span>
        Time: O(n + k log k), Space: O(n), where n = {operation === "encrypt" ? "plaintext" : "ciphertext"} length and
        k = key length. The k log k term comes from sorting the key letters to compute ranks; every character is
        placed and read exactly once, contributing the O(n) term.
      </div>
    </div>
  );
}
