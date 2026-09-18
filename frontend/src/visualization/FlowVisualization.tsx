import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { DURATION, drawPath, moveAlongPath, verticalBezier } from "./animations";

export type VizMode = "standard" | "dataflow";

interface CharFlow {
  row: number;
  column: number;
  character: string;
}

interface Props {
  keyLetters: string[];
  ranks: number[];
  readingOrder: number[];
  readColumnsSoFar: number[];
  activeColumn: number | null;
  activeCharacters: CharFlow[];
  outputSoFar: string;
  outputLength: number;
  outputLabel: string;
  mode: VizMode;
}

const SLOT = 40;
const SLOT_GAP = 6;
const SEQ_TOP = 8;
const SOURCE_TOP = 90;
const ARROW_Y = 150;
const OUTPUT_TOP = 178;

function slotX(i: number) {
  return i * (SLOT + SLOT_GAP);
}

export function FlowVisualization({
  keyLetters,
  ranks,
  readingOrder,
  readColumnsSoFar,
  activeColumn,
  activeCharacters,
  outputSoFar,
  outputLength,
  outputLabel,
  mode,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastAnimatedColumn = useRef<number | null>(null);

  const slotCount = Math.max(readingOrder.length, outputLength);
  const width = Math.max(slotCount * (SLOT + SLOT_GAP) - SLOT_GAP, 260);
  const height = OUTPUT_TOP + SLOT + 12;

  useEffect(() => {
    if (!svgRef.current || readingOrder.length === 0) return;
    const svg = d3.select(svgRef.current);

    let root = svg.select<SVGGElement>("g.flow-root");
    if (root.empty()) {
      root = svg.append("g").attr("class", "flow-root");
      root.append("g").attr("class", "layer-connectors");
      root.append("g").attr("class", "layer-sequence");
      root.append("g").attr("class", "layer-arrow");
      root.append("g").attr("class", "layer-output");
      root.append("g").attr("class", "layer-packets");
    }

    // ---------------- Reading-order sequence ----------------
    interface SeqDatum {
      col: number;
      orderIndex: number;
    }
    const seqData: SeqDatum[] = readingOrder.map((col, orderIndex) => ({ col, orderIndex }));

    const connectorSel = root
      .select("g.layer-connectors")
      .selectAll<SVGPathElement, SeqDatum>("path.connector")
      .data(seqData.slice(1), (d) => d.col);

    const connectorEnter = connectorSel
      .enter()
      .append("path")
      .attr("class", "connector")
      .attr("fill", "none")
      .attr("stroke", "var(--viz-flow-line)")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#flow-arrowhead)");

    connectorEnter.merge(connectorSel).attr("d", (d) => {
      const x1 = slotX(d.orderIndex - 1) + SLOT;
      const x2 = slotX(d.orderIndex);
      return `M ${x1} ${SEQ_TOP + SLOT / 2} L ${x2} ${SEQ_TOP + SLOT / 2}`;
    });

    connectorSel.exit().remove();

    const seqSel = root
      .select("g.layer-sequence")
      .selectAll<SVGGElement, SeqDatum>("g.seq-cell")
      .data(seqData, (d) => d.col);

    const seqEnter = seqSel
      .enter()
      .append("g")
      .attr("class", "seq-cell")
      .attr("transform", (d) => `translate(${slotX(d.orderIndex)},${SEQ_TOP})`)
      .style("opacity", 0);

    seqEnter
      .append("rect")
      .attr("class", "seq-rect")
      .attr("width", SLOT)
      .attr("height", SLOT)
      .attr("rx", 9)
      .attr("stroke-width", 1.5);
    seqEnter
      .append("text")
      .attr("class", "seq-letter")
      .attr("x", SLOT / 2)
      .attr("y", SLOT / 2 - 6)
      .attr("text-anchor", "middle")
      .style("font-weight", 700)
      .style("font-size", "14px")
      .style("fill", "var(--viz-text)");
    seqEnter
      .append("text")
      .attr("class", "seq-rank")
      .attr("x", SLOT / 2)
      .attr("y", SLOT / 2 + 12)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "var(--viz-text)")
      .style("opacity", 0.6);

    const seqMerge = seqEnter.merge(seqSel);
    seqMerge.transition().duration(DURATION.normal).style("opacity", 1);
    seqMerge
      .select<SVGRectElement>("rect.seq-rect")
      .transition()
      .duration(DURATION.fast)
      .attr("fill", (d) => (activeColumn === d.col ? "var(--viz-rank-active)" : "var(--viz-key-bg)"))
      .attr("stroke", (d) => (readColumnsSoFar.includes(d.col) ? "var(--viz-key-read)" : "var(--viz-border)"));
    seqMerge.select("text.seq-letter").text((d) => keyLetters[d.col] ?? "").style("fill", (d) => (activeColumn === d.col ? "white" : "var(--viz-text)"));
    seqMerge.select("text.seq-rank").text((d) => `#${ranks[d.col] ?? d.orderIndex + 1}`).style("fill", (d) => (activeColumn === d.col ? "white" : "var(--viz-text)"));

    seqSel.exit().remove();

    // ---------------- Down arrow to output ----------------
    const arrowLayer = root.select("g.layer-arrow");
    if (arrowLayer.select("path.down-arrow").empty()) {
      arrowLayer
        .append("path")
        .attr("class", "down-arrow")
        .attr("fill", "none")
        .attr("stroke", "var(--viz-flow-line)")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#flow-arrowhead)")
        .attr("d", `M ${width / 2} ${SEQ_TOP + SLOT + 6} L ${width / 2} ${ARROW_Y}`);
    }
    arrowLayer
      .select("path.down-arrow")
      .transition()
      .duration(DURATION.fast)
      .attr("stroke", activeColumn !== null ? "var(--viz-flow-line-active)" : "var(--viz-flow-line)");

    // ---------------- Output strip ----------------
    const outputChars = outputSoFar.split("");
    const outSel = root
      .select("g.layer-output")
      .selectAll<SVGGElement, { ch: string; i: number }>("g.out-cell")
      .data(
        outputChars.map((ch, i) => ({ ch, i })),
        (d) => d.i,
      );

    const outEnter = outSel
      .enter()
      .append("g")
      .attr("class", "out-cell")
      .attr("transform", (d) => `translate(${slotX(d.i)},${OUTPUT_TOP})`)
      .style("opacity", 0);

    outEnter
      .append("rect")
      .attr("width", SLOT)
      .attr("height", SLOT)
      .attr("rx", 9)
      .attr("fill", "var(--viz-cell-filled)")
      .attr("stroke", "var(--viz-key-read)")
      .attr("stroke-width", 1.5);
    outEnter
      .append("text")
      .attr("x", SLOT / 2)
      .attr("y", SLOT / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-weight", 700)
      .style("font-size", "17px")
      .style("fill", "var(--viz-text)")
      .text((d) => d.ch);

    outEnter
      .transition()
      .duration(DURATION.normal)
      .style("opacity", 1)
      .attr("transform", (d) => `translate(${slotX(d.i)},${OUTPUT_TOP})`);

    outSel.exit().transition().duration(DURATION.fast).style("opacity", 0).remove();

    // ---------------- Data-flow mode: animated packets ----------------
    root.select("g.layer-packets").selectAll("*").remove();
    if (mode === "dataflow" && activeColumn !== null && activeCharacters.length > 0 && lastAnimatedColumn.current !== activeColumn) {
      lastAnimatedColumn.current = activeColumn;
      const packetLayer = root.select<SVGGElement>("g.layer-packets");
      const startIndex = outputSoFar.length - activeCharacters.length;
      const orderIndex = readingOrder.indexOf(activeColumn);
      const sourceX = orderIndex >= 0 ? slotX(orderIndex) + SLOT / 2 : width / 2;

      activeCharacters.forEach((_c, idx) => {
        const targetIndex = startIndex + idx;
        if (targetIndex < 0) return;
        const targetX = slotX(targetIndex) + SLOT / 2;
        const pathData = verticalBezier(sourceX, SOURCE_TOP, targetX, OUTPUT_TOP + SLOT / 2);
        const path = packetLayer
          .append("path")
          .attr("d", pathData)
          .attr("fill", "none")
          .attr("stroke", "var(--viz-flow-line-active)")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.5);

        drawPath(path as d3.Selection<SVGPathElement, unknown, null, undefined>, DURATION.slow);

        const dot = packetLayer
          .append("circle")
          .attr("r", 5)
          .attr("fill", "var(--viz-rank-active)")
          .attr("transform", `translate(${sourceX},${SOURCE_TOP})`);

        const node = path.node();
        if (node) {
          setTimeout(() => {
            moveAlongPath(dot as d3.Selection<SVGCircleElement, unknown, null, undefined>, node, DURATION.slow, () => {
              dot.transition().duration(300).attr("opacity", 0).remove();
              path.transition().duration(300).attr("opacity", 0).remove();
            });
          }, idx * 80);
        }
      });
    } else if (activeColumn === null) {
      lastAnimatedColumn.current = null;
    }
  }, [keyLetters, ranks, readingOrder, readColumnsSoFar, activeColumn, activeCharacters, outputSoFar, mode, width]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
          Reading order
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
          {outputLabel}
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        <svg ref={svgRef} width={width} height={height} className="font-mono" style={{ minWidth: width }}>
          <defs>
            <marker id="flow-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--viz-flow-line)" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}
