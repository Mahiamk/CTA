import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { GridCell } from "../types/cipher";
import { DURATION } from "./animations";

export interface CellHover {
  row: number;
  column: number;
  char: string | null;
  readOrderIndex: number | null;
}

export interface KeyHover {
  column: number;
  char: string;
  rank: number | null;
}

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
  onCellHover?: (cell: CellHover | null) => void;
  onKeyHover?: (key: KeyHover | null) => void;
}

const CELL = 52;
const GAP = 8;
const KEY_ROW_H = 52;
const RANK_ROW_H = 44;
const HEADER_GAP = 10;

function colX(c: number) {
  return c * (CELL + GAP);
}

export function GridVisualization({
  keyLetters,
  ranks,
  grid,
  rows,
  columns,
  activeCell,
  activeColumn,
  readColumnsSoFar,
  readingOrder,
  onCellHover,
  onKeyHover,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = Math.max(columns * (CELL + GAP) - GAP, CELL);
  const gridTop = KEY_ROW_H + RANK_ROW_H + HEADER_GAP;
  const height = gridTop + Math.max(rows, 1) * (CELL + GAP) - GAP;

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    let root = svg.select<SVGGElement>("g.viz-root");
    if (root.empty()) {
      root = svg.append("g").attr("class", "viz-root");
      root.append("g").attr("class", "layer-key");
      root.append("g").attr("class", "layer-rank");
      root.append("g").attr("class", "layer-grid");
    }

    // ---------------- Key row ----------------
    type KeyDatum = { ch: string; i: number };
    const keyData: KeyDatum[] = keyLetters.map((ch, i) => ({ ch, i }));

    const keySel = root
      .select("g.layer-key")
      .selectAll<SVGGElement, KeyDatum>("g.key-cell")
      .data(keyData, (d) => d.i);

    const keyEnter = keySel
      .enter()
      .append("g")
      .attr("class", "key-cell")
      .attr("transform", (d) => `translate(${colX(d.i)},0)`)
      .style("cursor", "pointer")
      .style("opacity", 0);

    keyEnter
      .append("rect")
      .attr("class", "key-rect")
      .attr("width", CELL)
      .attr("height", CELL)
      .attr("rx", 12)
      .attr("stroke-width", 1.5);

    keyEnter
      .append("text")
      .attr("class", "key-text")
      .attr("x", CELL / 2)
      .attr("y", CELL / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-weight", 700)
      .style("font-size", "20px")
      .style("fill", "var(--viz-text)");

    const keyMerge = keyEnter.merge(keySel);
    keyMerge
      .on("mouseenter", (_e, d) =>
        onKeyHover?.({ column: d.i, char: d.ch, rank: ranks[d.i] ?? null }),
      )
      .on("mouseleave", () => onKeyHover?.(null));

    keyMerge.transition().duration(DURATION.normal).style("opacity", 1).attr("transform", (d) => `translate(${colX(d.i)},0)`);

    keyMerge
      .select<SVGRectElement>("rect.key-rect")
      .transition()
      .duration(DURATION.fast)
      .attr("fill", (d) => (activeColumn === d.i ? "var(--viz-key-active)" : "var(--viz-key-bg)"))
      .attr("stroke", (d) => (readColumnsSoFar.includes(d.i) ? "var(--viz-key-read)" : "var(--viz-border)"));

    keyMerge.select("text.key-text").text((d) => d.ch);

    keySel.exit().transition().duration(DURATION.fast).style("opacity", 0).remove();

    // ---------------- Rank row ----------------
    type RankDatum = { r: number; i: number };
    const rankData: RankDatum[] = ranks.length ? ranks.map((r, i) => ({ r, i })) : [];

    const rankSel = root
      .select("g.layer-rank")
      .selectAll<SVGGElement, RankDatum>("g.rank-cell")
      .data(rankData, (d) => d.i);

    const rankEnter = rankSel
      .enter()
      .append("g")
      .attr("class", "rank-cell")
      .attr("transform", (d) => `translate(${colX(d.i)},${KEY_ROW_H + 8})`)
      .style("opacity", 0);

    rankEnter
      .append("circle")
      .attr("class", "rank-circle")
      .attr("cx", CELL / 2)
      .attr("cy", RANK_ROW_H / 2 - 6)
      .attr("r", 15)
      .attr("stroke", "var(--viz-border)")
      .attr("stroke-width", 1.5);

    rankEnter
      .append("text")
      .attr("class", "rank-text")
      .attr("x", CELL / 2)
      .attr("y", RANK_ROW_H / 2 - 6)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-weight", 700)
      .style("font-size", "13px")
      .style("fill", "white");

    const rankMerge = rankEnter.merge(rankSel);
    rankMerge.transition().duration(DURATION.normal).style("opacity", 1);
    rankMerge
      .select<SVGCircleElement>("circle.rank-circle")
      .transition()
      .duration(DURATION.fast)
      .attr("fill", (d) => (activeColumn === d.i ? "var(--viz-rank-active)" : "var(--viz-rank-bg)"));
    rankMerge
      .select("text.rank-text")
      .style("fill", (d) => (activeColumn === d.i ? "white" : "var(--viz-text)"))
      .text((d) => d.r);

    rankSel.exit().transition().duration(DURATION.fast).style("opacity", 0).remove();

    // ---------------- Grid cells ----------------
    interface CellDatum {
      row: number;
      col: number;
      char: GridCell;
      key: string;
    }
    const gridData: CellDatum[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        gridData.push({ row: r, col: c, char: grid[r]?.[c] ?? null, key: `${r}-${c}` });
      }
    }

    const cellSel = root
      .select("g.layer-grid")
      .selectAll<SVGGElement, CellDatum>("g.grid-cell")
      .data(gridData, (d) => d.key);

    const cellEnter = cellSel
      .enter()
      .append("g")
      .attr("class", "grid-cell")
      .attr("transform", (d) => `translate(${colX(d.col)},${gridTop + d.row * (CELL + GAP)})`)
      .style("opacity", 0);

    cellEnter
      .append("rect")
      .attr("class", "cell-rect")
      .attr("width", CELL)
      .attr("height", CELL)
      .attr("rx", 10)
      .attr("stroke", "var(--viz-border)")
      .attr("stroke-width", 1.5)
      .attr("fill", "var(--viz-cell-empty)");

    cellEnter
      .append("text")
      .attr("class", "cell-text")
      .attr("x", CELL / 2)
      .attr("y", CELL / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-weight", 600)
      .style("font-size", "19px")
      .style("fill", "var(--viz-text)")
      .style("opacity", 0);

    const cellMerge = cellEnter.merge(cellSel);
    cellMerge
      .on("mouseenter", (_e, d) => {
        const orderIdx = readingOrder.indexOf(d.col);
        onCellHover?.({
          row: d.row,
          column: d.col,
          char: d.char,
          readOrderIndex: orderIdx >= 0 ? orderIdx + 1 : null,
        });
      })
      .on("mouseleave", () => onCellHover?.(null));

    cellMerge.transition().duration(DURATION.normal).style("opacity", 1);

    cellMerge
      .select<SVGRectElement>("rect.cell-rect")
      .transition()
      .duration(DURATION.fast)
      .attr("fill", (d) => {
        const isActive = activeCell && activeCell.row === d.row && activeCell.column === d.col;
        const inActiveCol = activeColumn === d.col && d.char !== null;
        if (isActive) return "var(--viz-cell-active)";
        if (inActiveCol) return "var(--viz-cell-col-active)";
        if (d.char !== null) return "var(--viz-cell-filled)";
        return "var(--viz-cell-empty)";
      })
      .attr("stroke", (d) => {
        const isActive = activeCell && activeCell.row === d.row && activeCell.column === d.col;
        return isActive ? "var(--viz-cell-active-border)" : "var(--viz-border)";
      })
      .attr("stroke-width", (d) => {
        const isActive = activeCell && activeCell.row === d.row && activeCell.column === d.col;
        return isActive ? 2.5 : 1.5;
      });

    cellMerge
      .select<SVGTextElement>("text.cell-text")
      .text((d) => d.char ?? "")
      .transition()
      .duration(DURATION.fast)
      .style("opacity", (d) => (d.char !== null ? 1 : 0));

    cellSel.exit().transition().duration(DURATION.fast).style("opacity", 0).remove();
  }, [
    keyLetters,
    ranks,
    grid,
    rows,
    columns,
    activeCell,
    activeColumn,
    readColumnsSoFar,
    readingOrder,
    gridTop,
    onCellHover,
    onKeyHover,
  ]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width={width} height={height} className="font-mono" style={{ minWidth: width }} />
    </div>
  );
}
