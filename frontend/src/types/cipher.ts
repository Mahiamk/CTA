/**
 * Mirrors the backend's algorithm-agnostic execution trace contract
 * (see backend/app/algorithms/base.py). `state` is intentionally untyped
 * at this layer — it is narrowed per `type` by the step-type guards below,
 * which is what lets a future algorithm add new step types without
 * changing this file.
 */
export interface AlgorithmStep {
  step: number;
  type: string;
  title: string;
  description: string;
  state: Record<string, unknown>;
}

export interface CipherMetadata {
  rows: number;
  columns: number;
  ranks: number[];
  readingOrder: number[];
  normalizedText: string;
  normalizedKey: string;
  removedTextChars: { char: string; index: number }[];
  removedKeyChars: { char: string; index: number }[];
}

export interface CipherResponse {
  algorithm: string;
  operation: "encrypt" | "decrypt";
  input: { text: string; key: string };
  result: string;
  steps: AlgorithmStep[];
  metadata: CipherMetadata;
}

export type Operation = "encrypt" | "decrypt";

export type GridCell = string | null;

// ---- Step state shapes (columnar transposition) ----

export interface InputState {
  text: string;
  key: string;
}

export interface NormalizeState {
  rawText: string;
  normalizedText: string;
  removed: { char: string; index: number }[];
}

export interface GridCreatedState {
  rows: number;
  columns: number;
  cellsRequired: number;
  characterCount: number;
  key: string;
}

export interface PlaceCharacterState {
  row: number;
  column: number;
  character: string;
  charIndex: number;
  grid: GridCell[][];
}

export interface KeyLetterInfo {
  char: string;
  originalIndex: number;
  rank: number;
}

export interface KeyRankingState {
  key: string;
  letters: KeyLetterInfo[];
  ranks: number[];
  readingOrder: number[];
}

export interface ReadColumnState {
  orderIndex: number;
  column: number;
  rank: number;
  keyLetter: string;
  charactersRead: { row: number; column: number; character: string }[];
  columnText: string;
  ciphertextSoFar: string;
}

export interface CompleteEncryptState {
  ciphertext: string;
  charactersProcessed: number;
  columnsRead: number;
  rowsProcessed: number;
}

export interface GridDimensionsState {
  rows: number;
  columns: number;
  characterCount: number;
}

export interface ColumnLengthsState {
  columns: { column: number; rank: number; length: number }[];
}

export interface DistributeColumnState {
  orderIndex: number;
  column: number;
  rank: number;
  keyLetter: string;
  length: number;
  charactersPlaced: { row: number; column: number; character: string }[];
  grid: GridCell[][];
}

export interface ReadRowState {
  row: number;
  rowText: string;
  plaintextSoFar: string;
}

export interface CompleteDecryptState {
  plaintext: string;
  charactersProcessed: number;
  columnsRead: number;
  rowsProcessed: number;
}
