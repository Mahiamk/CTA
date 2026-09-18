import type {
  AlgorithmStep,
  ColumnLengthsState,
  CompleteDecryptState,
  CompleteEncryptState,
  DistributeColumnState,
  GridCell,
  GridCreatedState,
  GridDimensionsState,
  InputState,
  KeyRankingState,
  NormalizeState,
  Operation,
  PlaceCharacterState,
  ReadColumnState,
  ReadRowState,
} from "../types/cipher";

/**
 * A step trace is a log of *what happened*. To render any given step we need
 * the *cumulative* picture (e.g. the grid as filled so far), so this folds
 * steps 0..currentIndex into a single view model. It is pure and cheap
 * (traces top out around a few dozen steps), so it recomputes on every step
 * change rather than maintaining incremental state.
 */
export interface VizState {
  stepType: string;
  title: string;
  description: string;

  key: string;
  rows: number;
  columns: number;
  grid: GridCell[][];

  ranks: number[]; // empty until ranked
  readingOrder: number[]; // empty until ranked
  readColumnsSoFar: number[]; // original column indices already fully read, in order

  activeCell: { row: number; column: number } | null;
  activeColumn: number | null;
  activeCharacters: { row: number; column: number; character: string }[];

  ciphertextSoFar: string;
  plaintextSoFar: string;
  finalResult: string | null;

  columnLengths: ColumnLengthsState["columns"];
}

const EMPTY_VIZ_STATE: VizState = {
  stepType: "idle",
  title: "",
  description: "",
  key: "",
  rows: 0,
  columns: 0,
  grid: [],
  ranks: [],
  readingOrder: [],
  readColumnsSoFar: [],
  activeCell: null,
  activeColumn: null,
  activeCharacters: [],
  ciphertextSoFar: "",
  plaintextSoFar: "",
  finalResult: null,
  columnLengths: [],
};

function emptyGrid(rows: number, columns: number): GridCell[][] {
  return Array.from({ length: rows }, () => Array<GridCell>(columns).fill(null));
}

export function deriveVizState(
  steps: AlgorithmStep[],
  currentIndex: number,
  operation: Operation,
): VizState {
  const state: VizState = { ...EMPTY_VIZ_STATE, grid: [], ranks: [], readingOrder: [], readColumnsSoFar: [], activeCharacters: [], columnLengths: [] };

  for (let i = 0; i <= currentIndex && i < steps.length; i++) {
    const step = steps[i];
    state.stepType = step.type;
    state.title = step.title;
    state.description = step.description;
    state.activeCell = null;
    state.activeColumn = null;
    state.activeCharacters = [];

    switch (step.type) {
      case "input": {
        const s = step.state as unknown as InputState;
        state.key = s.key;
        break;
      }
      case "normalize": {
        const s = step.state as unknown as NormalizeState;
        state.key = state.key || "";
        void s;
        break;
      }
      case "grid_created": {
        const s = step.state as unknown as GridCreatedState;
        state.rows = s.rows;
        state.columns = s.columns;
        state.key = s.key;
        state.grid = emptyGrid(s.rows, s.columns);
        break;
      }
      case "place_character": {
        const s = step.state as unknown as PlaceCharacterState;
        state.grid = s.grid;
        state.activeCell = { row: s.row, column: s.column };
        break;
      }
      case "key_ranking": {
        const s = step.state as unknown as KeyRankingState;
        state.key = s.key;
        state.ranks = s.ranks;
        state.readingOrder = s.readingOrder;
        break;
      }
      case "read_column": {
        const s = step.state as unknown as ReadColumnState;
        state.activeColumn = s.column;
        state.activeCharacters = s.charactersRead;
        state.ciphertextSoFar = s.ciphertextSoFar;
        if (!state.readColumnsSoFar.includes(s.column)) {
          state.readColumnsSoFar = [...state.readColumnsSoFar, s.column];
        }
        break;
      }
      case "grid_dimensions": {
        const s = step.state as unknown as GridDimensionsState;
        state.rows = s.rows;
        state.columns = s.columns;
        state.grid = emptyGrid(s.rows, s.columns);
        break;
      }
      case "column_lengths": {
        const s = step.state as unknown as ColumnLengthsState;
        state.columnLengths = s.columns;
        break;
      }
      case "distribute_column": {
        const s = step.state as unknown as DistributeColumnState;
        state.grid = s.grid;
        state.activeColumn = s.column;
        state.activeCharacters = s.charactersPlaced;
        if (!state.readColumnsSoFar.includes(s.column)) {
          state.readColumnsSoFar = [...state.readColumnsSoFar, s.column];
        }
        break;
      }
      case "read_row": {
        const s = step.state as unknown as ReadRowState;
        state.plaintextSoFar = s.plaintextSoFar;
        state.activeCell = { row: s.row, column: -1 };
        break;
      }
      case "complete": {
        if (operation === "encrypt") {
          const s = step.state as unknown as CompleteEncryptState;
          state.finalResult = s.ciphertext;
          state.ciphertextSoFar = s.ciphertext;
        } else {
          const s = step.state as unknown as CompleteDecryptState;
          state.finalResult = s.plaintext;
          state.plaintextSoFar = s.plaintext;
        }
        break;
      }
      default:
        break;
    }
  }

  return state;
}
