import * as d3 from "d3";

export const DURATION = {
  fast: 200,
  normal: 350,
  slow: 550,
} as const;

/**
 * Animate an SVG path "drawing itself" using the classic
 * stroke-dasharray / stroke-dashoffset technique.
 */
export function drawPath(
  selection: d3.Selection<SVGPathElement, unknown, null, undefined>,
  duration: number = DURATION.slow,
) {
  const node = selection.node();
  if (!node) return;
  const length = node.getTotalLength();
  selection
    .attr("stroke-dasharray", `${length} ${length}`)
    .attr("stroke-dashoffset", length)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .attr("stroke-dashoffset", 0);
}

/**
 * Move a circle ("packet") along an existing SVG path over `duration` ms.
 */
export function moveAlongPath(
  dot: d3.Selection<SVGCircleElement, unknown, null, undefined>,
  path: SVGPathElement,
  duration: number = DURATION.slow,
  onEnd?: () => void,
) {
  const length = path.getTotalLength();
  dot
    .transition()
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .attrTween("transform", () => (t: number) => {
      const point = path.getPointAtLength(t * length);
      return `translate(${point.x},${point.y})`;
    })
    .on("end", () => onEnd?.());
}

/** Cubic bezier path between two points, curving through the vertical midpoint. */
export function verticalBezier(x1: number, y1: number, x2: number, y2: number): string {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}
