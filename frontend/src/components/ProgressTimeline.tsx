import type { AlgorithmStep, Operation } from "../types/cipher";
import { getPhases } from "../visualization/phases";

interface Props {
  steps: AlgorithmStep[];
  currentStep: number;
  operation: Operation;
  onGoToStep: (index: number) => void;
}

export function ProgressTimeline({ steps, currentStep, operation, onGoToStep }: Props) {
  const phases = getPhases(operation);
  const currentType = steps[currentStep]?.type;
  const currentPhaseIndex = phases.findIndex((p) => p.types.includes(currentType ?? ""));

  const firstStepIndexForPhase = (phaseIndex: number) => {
    const phase = phases[phaseIndex];
    return steps.findIndex((s) => phase.types.includes(s.type));
  };

  const progressPct = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {phases.map((phase, i) => {
          const stepIndex = firstStepIndexForPhase(i);
          const isDone = i < currentPhaseIndex;
          const isActive = i === currentPhaseIndex;
          const disabled = stepIndex === -1;
          return (
            <div key={phase.key} className="flex items-center gap-2">
              <button
                disabled={disabled}
                onClick={() => onGoToStep(stepIndex)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isDone
                      ? "bg-indigo-100 text-indigo-700 dark:bg-white/10 dark:text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-white" : isDone ? "bg-indigo-500" : "bg-slate-400 dark:bg-gray-500"
                  }`}
                />
                {phase.label}
              </button>
              {i < phases.length - 1 && <span className="text-slate-300 dark:text-gray-600">—</span>}
            </div>
          );
        })}
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(steps.length - 1, 0)}
        value={currentStep}
        onChange={(e) => onGoToStep(Number(e.target.value))}
        className="w-full accent-indigo-600"
        style={{
          background: `linear-gradient(to right, var(--viz-rank-active) ${progressPct}%, var(--viz-border) ${progressPct}%)`,
        }}
      />
    </div>
  );
}
