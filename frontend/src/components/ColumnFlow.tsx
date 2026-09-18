import { FlowVisualization, type VizMode } from "../visualization/FlowVisualization";

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

export function ColumnFlow(props: Props) {
  if (!props.readingOrder.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-white/15 dark:text-gray-500">
        Column reading order will appear once the key is ranked.
      </div>
    );
  }

  return <FlowVisualization {...props} />;
}
