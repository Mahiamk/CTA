import type { PlaybackSpeed } from "../hooks/useAlgorithmPlayback";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];

interface Props {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isAtStart: boolean;
  isComplete: boolean;
  speed: PlaybackSpeed;
  onPrevious: () => void;
  onNext: () => void;
  onToggle: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

export function StepControls({
  currentStep,
  totalSteps,
  isPlaying,
  isAtStart,
  isComplete,
  speed,
  onPrevious,
  onNext,
  onToggle,
  onSpeedChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={isAtStart}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
        >
          ← Previous
        </button>
        <button
          onClick={onToggle}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={onNext}
          disabled={isComplete}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
        >
          Next →
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
          Step {currentStep + 1} / {totalSteps}
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5 dark:border-white/10">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                speed === s
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/10"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
