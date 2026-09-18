import type { Operation } from "../types/cipher";

export interface Phase {
  key: string;
  label: string;
  types: string[];
}

const ENCRYPT_PHASES: Phase[] = [
  { key: "input", label: "Input", types: ["input"] },
  { key: "normalize", label: "Normalize", types: ["normalize"] },
  { key: "grid", label: "Create Grid", types: ["grid_created"] },
  { key: "fill", label: "Fill Grid", types: ["place_character"] },
  { key: "rank", label: "Rank Key", types: ["key_ranking"] },
  { key: "read", label: "Read Columns", types: ["read_column"] },
  { key: "done", label: "Ciphertext", types: ["complete"] },
];

const DECRYPT_PHASES: Phase[] = [
  { key: "input", label: "Input", types: ["input"] },
  { key: "rank", label: "Rank Key", types: ["key_ranking"] },
  { key: "dims", label: "Grid Dimensions", types: ["grid_dimensions", "column_lengths"] },
  { key: "distribute", label: "Fill Columns", types: ["distribute_column"] },
  { key: "rows", label: "Read Rows", types: ["read_row"] },
  { key: "done", label: "Plaintext", types: ["complete"] },
];

export function getPhases(operation: Operation): Phase[] {
  return operation === "encrypt" ? ENCRYPT_PHASES : DECRYPT_PHASES;
}
