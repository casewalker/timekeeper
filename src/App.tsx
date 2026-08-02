import type { SubmitEventHandler } from "react";
import { useState } from "react";
import TimerController from "@/components/TimerController";
import useCountdown from "@/hooks/useCountdown";
import "@/App.css";

const formatTimer = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;

const formatDuration = (seconds: number) => {
  if (seconds === 0) return "0 Seconds";

  const pluralize = (string: string, n: number) => (n === 1 ? string : `${string}s`);

  const numMinutes = Math.floor(seconds / 60);
  const numSeconds = seconds % 60;

  const minutesPart = `${numMinutes > 0 ? numMinutes + " " + pluralize("Minute", numMinutes) : ""}`;
  const secondsPart = `${numSeconds > 0 ? numSeconds + " " + pluralize("Second", numSeconds) : ""}`;

  return `${minutesPart}${numMinutes > 0 && numSeconds > 0 ? " and " : ""}${secondsPart}`;
};

export default function App() {
  const [sharingSeconds, setSharingSeconds] = useState(0);
  const [warningSeconds, setWarningSeconds] = useState(0);
  const { countdownPhase, remainingTimerSeconds, start, stop } = useCountdown();
  const isEditing = countdownPhase === "editing";
  const isFinished = countdownPhase === "finished";

  const handleStart: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    // Invariant: 0 <= warning <= sharing; if warning is too big, silently drag it down
    setWarningSeconds(Math.min(warningSeconds, sharingSeconds));
    start(sharingSeconds, warningSeconds);
  };

  type PhasedResources = {
    timerColor: string;
    countdownTime: number;
    warningTextPrimary: string;
    warningTextSecondary: string;
  };

  const phasedResources = (function (): PhasedResources {
    switch (countdownPhase) {
      case "running":
        return {
          timerColor: "#444444",
          countdownTime: remainingTimerSeconds,
          warningTextPrimary: "",
          warningTextSecondary: "",
        };
      case "warning":
        return {
          timerColor: "orange",
          countdownTime: remainingTimerSeconds,
          warningTextPrimary: "Warning",
          warningTextSecondary: `Say: "${formatDuration(warningSeconds)}"`,
        };
      case "finished":
        return {
          timerColor: "red",
          countdownTime: remainingTimerSeconds,
          warningTextPrimary: "Finished!",
          warningTextSecondary: 'Say: "Time!"',
        };
      case "editing":
      default:
        return {
          timerColor: "#666666",
          countdownTime: sharingSeconds,
          warningTextPrimary: "",
          warningTextSecondary: "",
        };
    }
  })();

  return (
    <main>
      {(countdownPhase === "warning" || countdownPhase === "finished") && (
        // Key forces rerender on phase transitions, replaying the CSS animation once
        <div
          key={countdownPhase}
          className={`phase-pulse phase-pulse--${countdownPhase}`}
          aria-hidden="true"
        />
      )}
      <div role="timer" aria-label={formatDuration(phasedResources.countdownTime)}>
        <span style={{ color: phasedResources.timerColor }}>
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
          maxTotalSeconds={sharingSeconds}
          disabled={!isEditing}
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
