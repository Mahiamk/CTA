import { useCallback, useEffect, useRef, useState } from "react";

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

const BASE_STEP_DURATION_MS = 900;

export interface AlgorithmPlayback {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  isComplete: boolean;
  isAtStart: boolean;
  next: () => void;
  previous: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  goToStep: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
}

/**
 * Drives step-by-step playback over an arbitrary sequence of length
 * `stepCount`. Knows nothing about what a "step" represents — that lets it
 * be reused by any future algorithm's trace, not just columnar transposition.
 */
export function useAlgorithmPlayback(stepCount: number): AlgorithmPlayback {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSteps = Math.max(stepCount, 1);
  const isComplete = currentStep >= totalSteps - 1;
  const isAtStart = currentStep <= 0;

  const clamp = useCallback(
    (index: number) => Math.min(Math.max(index, 0), totalSteps - 1),
    [totalSteps],
  );

  const next = useCallback(() => setCurrentStep((s) => clamp(s + 1)), [clamp]);
  const previous = useCallback(() => setCurrentStep((s) => clamp(s - 1)), [clamp]);
  const goToStep = useCallback((index: number) => setCurrentStep(clamp(index)), [clamp]);

  const play = useCallback(() => {
    if (isComplete) setCurrentStep(0);
    setIsPlaying(true);
  }, [isComplete]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  // Reset playback position whenever the underlying step count changes
  // (i.e. a fresh encrypt/decrypt run), so no stale step index lingers.
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [stepCount]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }
    const duration = BASE_STEP_DURATION_MS / speed;
    timerRef.current = setTimeout(() => {
      setCurrentStep((s) => clamp(s + 1));
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, speed, totalSteps, clamp]);

  return {
    currentStep,
    totalSteps,
    isPlaying,
    speed,
    isComplete,
    isAtStart,
    next,
    previous,
    play,
    pause,
    toggle,
    reset,
    goToStep,
    setSpeed,
  };
}
