import { useState } from "react";
import { GridVisualization, type CellHover, type KeyHover } from "../visualization/GridVisualization";
import type { GridCell } from "../types/cipher";

interface Props {
  keyLetters: string[];
  ranks: number[];
  grid: GridCell[][];
  rows: number;
  columns: number;
  activeCell: { row: number; column: number } | null;
  activeColumn: number | null;
  readColumnsSoFar: number[];
  readingOrder: number[];
  characterCount: number;
}

export function CipherGrid({
  keyLetters,
  ranks,
  grid,
  rows,
  columns,
  activeCell,
  activeColumn,
  readColumnsSoFar,
  readingOrder,
  characterCount,
}: Props) {
  const [cellHover, setCellHover] = useState<CellHover | null>(null);
  const [keyHover, setKeyHover] = useState<KeyHover | null>(null);

  if (columns === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-white/15 dark:text-gray-500">
        The grid will appear here once the algorithm creates it.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-gray-400">
        <span>
          Columns: <strong className="text-slate-700 dark:text-white">{columns}</strong>
        </span>
        <span>
          Rows: <strong className="text-slate-700 dark:text-white">{rows}</strong>
        </span>
        <span>
          Cells: <strong className="text-slate-700 dark:text-white">{rows * columns}</strong>
        </span>
        <span>
          Characters: <strong className="text-slate-700 dark:text-white">{characterCount}</strong>
        </span>
      </div>

      <GridVisualization
        keyLetters={keyLetters}
        ranks={ranks}
        grid={grid}
        rows={rows}
        columns={columns}
        activeCell={activeCell}
        activeColumn={activeColumn}
        readColumnsSoFar={readColumnsSoFar}
        readingOrder={readingOrder}
        onCellHover={setCellHover}
        onKeyHover={setKeyHover}
      />

      <div className="mt-3 min-h-[2.25rem] rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-white/5 dark:text-gray-300">
        {cellHover ? (
          <span className="font-mono">
            Character: <strong>{cellHover.char ?? "—"}</strong> · Row {cellHover.row + 1} · Column {cellHover.column + 1}
            {cellHover.readOrderIndex !== null && <> · Read order #{cellHover.readOrderIndex}</>}
          </span>
        ) : keyHover ? (
          <span className="font-mono">
            Letter: <strong>{keyHover.char}</strong> · Original position {keyHover.column + 1}
            {keyHover.rank !== null && <> · Rank {keyHover.rank} · Column {keyHover.column + 1}</>}
          </span>
        ) : (
          <span className="italic text-slate-400 dark:text-gray-500">Hover a key letter or grid cell to inspect it.</span>
        )}
      </div>
    </div>
  );
}
