import type { SubmitEventHandler } from "react";
import { useState } from "react";
import TimerController from "@/components/TimerController";
import useCountdown from "@/hooks/useCountdown";
import { readStoredTimes, writeStoredTimes } from "@/util/storedTimes";
import "@/App.css";

const formatTimer = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;

const getReadableDurationFormat = (seconds: number) => {
  if (seconds === 0) return "0 Seconds";

  const pluralize = (string: string, n: number) => (n === 1 ? string : `${string}s`);

  const numMinutes = Math.floor(seconds / 60);
  const numSeconds = seconds % 60;

  const minutesPart = `${numMinutes > 0 ? numMinutes + " " + pluralize("Minute", numMinutes) : ""}`;
  const secondsPart = `${numSeconds > 0 ? numSeconds + " " + pluralize("Second", numSeconds) : ""}`;

  return `${minutesPart}${numMinutes > 0 && numSeconds > 0 ? " and " : ""}${secondsPart}`;
};

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

  type PhasedResources = {
    countdownTime: number;
    warningTextPrimary: string;
    warningTextSecondary: string;
  };

  const phasedResources = (function (): PhasedResources {
    switch (countdownPhase) {
      case "running":
        return {
          countdownTime: remainingTimerSeconds,
          warningTextPrimary: "",
          warningTextSecondary: "",
        };
      case "warning":
        return {
          countdownTime: remainingTimerSeconds,
          warningTextPrimary: "Warning",
          warningTextSecondary: `Say: "${getReadableDurationFormat(warningSeconds)}"`,
        };
      case "finished":
        return {
          countdownTime: remainingTimerSeconds,
          warningTextPrimary: "Finished!",
          warningTextSecondary: 'Say: "Time!"',
        };
      case "editing":
      default:
        return { countdownTime: sharingSeconds, warningTextPrimary: "", warningTextSecondary: "" };
    }
  })();

  return (
    <main>
      {(countdownPhase === "warning" || countdownPhase === "finished") && (
        // `key` forces rerender on phase transitions, replaying the CSS animation once
        <div
          key={countdownPhase}
          className={`phase-pulse phase-pulse--${countdownPhase}`}
          aria-hidden="true"
        />
      )}
      <div role="timer" aria-label={getReadableDurationFormat(phasedResources.countdownTime)}>
        <span className={`timer-value timer-value--${countdownPhase}`}>
          {formatTimer(phasedResources.countdownTime)}
        </span>
      </div>
      <div role="alert">
        <p>{phasedResources.warningTextPrimary}</p>
        <p>{phasedResources.warningTextSecondary}</p>
      </div>
      <form onSubmit={handleStart}>
        <TimerController
          label="Sharing Time"
          currentTotalSeconds={sharingSeconds}
          onUpdate={setSharingSeconds}
          maxTotalSeconds={59999} // 999 minutes, 59 seconds
          disabled={!isEditing}
        />
        <TimerController
          label="Warning Time"
          currentTotalSeconds={warningSeconds}
          onUpdate={setWarningSeconds}
          maxTotalSeconds={59999} // 999 minutes, 59 seconds
          disabled={!isEditing}
          error={
            warningExceedsSharing ? "Warning Time can't be longer than Sharing Time" : undefined
          }
        />
        {isEditing ? (
          <button type="submit" disabled={sharingSeconds === 0}>
            Start
          </button>
        ) : (
          <>
            <button type="button" onClick={() => start(sharingSeconds, warningSeconds)}>
              Restart
            </button>
            <button type="button" onClick={() => stop()}>
              {!isFinished ? "Stop" : "Edit"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
