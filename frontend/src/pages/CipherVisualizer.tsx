import { useCallback, useEffect, useMemo, useState } from "react";
import { cipherApi, ApiError } from "../services/api";
import type { CipherResponse, Operation } from "../types/cipher";
import { useAlgorithmPlayback } from "../hooks/useAlgorithmPlayback";
import { deriveVizState } from "../visualization/deriveVizState";
import type { VizMode } from "../visualization/FlowVisualization";

import { CipherInput } from "../components/CipherInput";
import { CipherGrid } from "../components/CipherGrid";
import { KeyRanking } from "../components/KeyRanking";
import { ColumnFlow } from "../components/ColumnFlow";
import { CipherOutput } from "../components/CipherOutput";
import { StepControls } from "../components/StepControls";
import { AlgorithmExplanation } from "../components/AlgorithmExplanation";
import { ProgressTimeline } from "../components/ProgressTimeline";

const DEFAULT_TEXT = "WEAREDISCOVEREDFLEEATONCE";
const DEFAULT_KEY = "ZEBRAS";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export function CipherVisualizer() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [keyValue, setKeyValue] = useState(DEFAULT_KEY);
  const [operation, setOperation] = useState<Operation>("encrypt");
  const [response, setResponse] = useState<CipherResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vizMode, setVizMode] = useState<VizMode>("standard");
  const { theme, toggle: toggleTheme } = useTheme();

  const steps = useMemo(() => response?.steps ?? [], [response]);
  const playback = useAlgorithmPlayback(steps.length);

  const vizState = useMemo(
    () => deriveVizState(steps, playback.currentStep, operation),
    [steps, playback.currentStep, operation],
  );

  const runCipher = useCallback(
    async (op: Operation) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = op === "encrypt" ? await cipherApi.encrypt(text, keyValue) : await cipherApi.decrypt(text, keyValue);
        setOperation(op);
        setResponse(result);
      } catch (err) {
        setResponse(null);
        setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [text, keyValue],
  );

  const handleReset = useCallback(() => {
    setResponse(null);
    setError(null);
    playback.reset();
  }, [playback]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!response) return;

      if (e.code === "Space") {
        e.preventDefault();
        playback.toggle();
      } else if (e.code === "ArrowRight") {
        playback.next();
      } else if (e.code === "ArrowLeft") {
        playback.previous();
      } else if (e.key.toLowerCase() === "r") {
        handleReset();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playback, response, handleReset]);

  const finalState = response?.steps.find((s) => s.type === "complete")?.state as
    | { charactersProcessed: number; columnsRead: number; rowsProcessed: number }
    | undefined;

  return (
    <div className="min-h-screen bg-dot-grid text-slate-900 dark:text-white">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Columnar Cipher Visualizer
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400">Interactive Algorithm Visualization</p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/10"
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <CipherInput
          text={text}
          keyValue={keyValue}
          operation={operation}
          isLoading={isLoading}
          error={error}
          onTextChange={setText}
          onKeyChange={setKeyValue}
          onSubmit={runCipher}
          onReset={handleReset}
        />

        {response && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                  Algorithm Visualizer
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-slate-500 dark:text-gray-400">Visualization Mode</span>
                  <button
                    onClick={() => setVizMode((m) => (m === "standard" ? "dataflow" : "standard"))}
                    className={`relative h-6 w-24 rounded-full transition ${
                      vizMode === "dataflow" ? "bg-indigo-600" : "bg-slate-300 dark:bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 flex h-5 w-11 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700 shadow transition ${
                        vizMode === "dataflow" ? "left-[46px]" : "left-0.5"
                      }`}
                    >
                      {vizMode === "dataflow" ? "Flow" : "Standard"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
                <div className="min-w-0">
                <CipherGrid
                  keyLetters={vizState.key.split("")}
                  ranks={vizState.ranks}
                  grid={vizState.grid}
                  rows={vizState.rows}
                  columns={vizState.columns}
                  activeCell={vizState.activeCell}
                  activeColumn={vizState.activeColumn}
                  readColumnsSoFar={vizState.readColumnsSoFar}
                  readingOrder={vizState.readingOrder}
                  characterCount={response.metadata.normalizedText.length}
                />
                </div>

                <div className="flex min-w-0 flex-col gap-4">
                  <KeyRanking keyLetters={vizState.key.split("")} ranks={vizState.ranks} readingOrder={vizState.readingOrder} />
                  <ColumnFlow
                    keyLetters={vizState.key.split("")}
                    ranks={vizState.ranks}
                    readingOrder={vizState.readingOrder}
                    readColumnsSoFar={vizState.readColumnsSoFar}
                    activeColumn={vizState.activeColumn}
                    activeCharacters={vizState.activeCharacters}
                    outputSoFar={operation === "encrypt" ? vizState.ciphertextSoFar : vizState.plaintextSoFar}
                    outputLength={response.metadata.normalizedText.length}
                    outputLabel={operation === "encrypt" ? "Ciphertext" : "Plaintext"}
                    mode={vizMode}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <ProgressTimeline
                steps={steps}
                currentStep={playback.currentStep}
                operation={operation}
                onGoToStep={playback.goToStep}
              />
              <div className="my-4 h-px bg-slate-100 dark:bg-white/10" />
              <StepControls
                currentStep={playback.currentStep}
                totalSteps={playback.totalSteps}
                isPlaying={playback.isPlaying}
                isAtStart={playback.isAtStart}
                isComplete={playback.isComplete}
                speed={playback.speed}
                onPrevious={playback.previous}
                onNext={playback.next}
                onToggle={playback.toggle}
                onSpeedChange={playback.setSpeed}
              />
              <p className="mt-3 text-center text-[11px] text-slate-400 dark:text-gray-500">
                Shortcuts: Space play/pause · ← → step · R reset
              </p>
            </section>

            <AlgorithmExplanation stepType={vizState.stepType} description={vizState.description} operation={operation} />

            {vizState.finalResult && finalState && (
              <CipherOutput
                result={vizState.finalResult}
                operation={operation}
                charactersProcessed={finalState.charactersProcessed}
                columnsRead={finalState.columnsRead}
                rowsProcessed={finalState.rowsProcessed}
              />
            )}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-slate-400 dark:text-gray-600">
        Columnar Transposition Cipher · Interactive Cryptography Lab
      </footer>
    </div>
  );
}
