import type { SubmitEventHandler } from "react";
import { useState } from "react";
import TimerController from "@/components/TimerController";
import useCountdown from "@/hooks/useCountdown";
import { getReadableDurationFormat } from "@/util/formatDuration";
import { readStoredTimes, writeStoredTimes } from "@/util/storedTimes";
import "@/App.css";

const formatTimer = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;

// Pill button styles
const pillBase =
  "cursor-pointer rounded-full px-8 py-3 text-base transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800 " +
  "disabled:cursor-not-allowed dark:focus-visible:outline-stone-100";
const pillPrimary =
  `${pillBase} bg-stone-900 text-stone-50 hover:bg-stone-700 ` +
  "disabled:bg-stone-300 disabled:text-stone-500 " +
  "dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300 " +
  "dark:disabled:bg-stone-800 dark:disabled:text-stone-600";
const pillSecondary =
  `${pillBase} border border-stone-300 text-stone-700 hover:border-stone-400 ` +
  "hover:bg-stone-500/10 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500";

export default function App() {
  const [sharingSeconds, setSharingSeconds] = useState(() => readStoredTimes().sharingSeconds);
  const [warningSeconds, setWarningSeconds] = useState(() => readStoredTimes().warningSeconds);
  const { countdownPhase, remainingTimerSeconds, start, stop } = useCountdown();
  const warningExceedsSharing = warningSeconds > 0 && warningSeconds >= sharingSeconds;
  const isEditing = countdownPhase === "editing";
  const isFinished = countdownPhase === "finished";

  const handleStart: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    // Invariant: 0 ≤ warning ≤ sharing; if warning is too big, silently drag it down upon starting
    const actualWarningSeconds = Math.min(warningSeconds, sharingSeconds);
    setWarningSeconds(actualWarningSeconds);
    writeStoredTimes({ sharingSeconds, warningSeconds: actualWarningSeconds });
    start(sharingSeconds, actualWarningSeconds);
  };

  const timerAnnouncement = (function (): string {
    switch (countdownPhase) {
      case "warning":
        return `Say: "${getReadableDurationFormat(warningSeconds)}"`;
      case "finished":
        return 'Say: "Time!"';
      default:
        return "";
    }
  })();

  const isOverTime = remainingTimerSeconds < 0;
  const displaySeconds = Math.abs(remainingTimerSeconds);
  const spokenTime = `${getReadableDurationFormat(displaySeconds)}${isOverTime ? " over time" : ""}`;

  return (
    <main
      className={`mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12 text-center ${
        isEditing ? "gap-8" : "gap-12"
      }`}
    >
      {!isEditing ? (
        <>
          {/* Timer phase-change pulse */}
          {(countdownPhase === "warning" || countdownPhase === "finished") && (
            <div
              // `key` forces rerender on phase transitions, replaying the CSS animation once
              key={countdownPhase}
              className={`phase-pulse phase-pulse--${countdownPhase}`}
              aria-hidden="true"
            />
          )}
          {/* Timer */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex min-h-10 flex-col justify-end" role="alert">
              <p className="font-numeral text-3xl font-bold text-stone-800 dark:text-stone-100">
                {timerAnnouncement}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div role="timer" aria-label={spokenTime}>
                <span
                  className={`timer-value timer-value--${countdownPhase} font-numeral text-[clamp(3.5rem,min(26vw,22vh),8rem)] leading-none lining-nums tabular-nums`}
                >
                  {`${isOverTime ? "-" : ""}${formatTimer(displaySeconds)}`}
                </span>
              </div>
              {/* Slot held open so the buttons don't shift when overtime starts */}
              <p
                className="min-h-6 text-lg text-stone-500 italic dark:text-stone-400"
                aria-hidden="true"
              >
                {isOverTime ? "over time" : ""}
              </p>
            </div>
          </div>
          {/* Control buttons */}
          <div className="flex w-full max-w-xs items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => start(sharingSeconds, warningSeconds)}
              className={`${isFinished ? pillPrimary : pillSecondary} flex-1`}
            >
              Restart
            </button>
            <button type="button" onClick={() => stop()} className={`${pillSecondary} flex-1`}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleStart} className="flex w-full flex-col items-center gap-6">
          <TimerController
            label="Share Time"
            currentTotalSeconds={sharingSeconds}
            onUpdate={setSharingSeconds}
            maxTotalSeconds={59999} // 999 minutes, 59 seconds
          />
          <TimerController
            label="Warning"
            currentTotalSeconds={warningSeconds}
            onUpdate={setWarningSeconds}
            maxTotalSeconds={59999} // 999 minutes, 59 seconds
            error={warningExceedsSharing ? "Warning can't be longer than Share Time" : undefined}
          />
          <button
            type="submit"
            disabled={sharingSeconds === 0}
            className={`${pillPrimary} w-full max-w-xs`}
          >
            Start
          </button>
        </form>
      )}
    </main>
  );
}
