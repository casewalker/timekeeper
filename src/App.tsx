import type { SubmitEventHandler } from "react";
import { useState } from "react";
import TimerController from "@/components/TimerController";
import useCountdown from "@/hooks/useCountdown";
import "@/App.css";

const formatTimer = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;

const formatWarningText = (warningSeconds: number) => {
  const pluralize = (string: string, n: number) => (n === 1 ? string : `${string}s`);

  const numMinutes = Math.floor(warningSeconds / 60);
  const numSeconds = warningSeconds % 60;

  const minutesPart = `${numMinutes > 0 ? numMinutes + " " + pluralize("Minute", numMinutes) : ""}`;
  const secondsPart = `${numSeconds > 0 ? numSeconds + " " + pluralize("Second", numSeconds) : ""}`;

  return `${minutesPart}${numMinutes > 0 && numSeconds > 0 ? " and " : ""}${secondsPart}`;
};

export default function App() {
  const [sharingSeconds, setSharingSeconds] = useState(0);
  const [warningSeconds, setWarningSeconds] = useState(0);
  const { countdownPhase, remainingTimerSeconds, start, stop } = useCountdown();
  const isEditing = countdownPhase === "editing";

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
          warningTextSecondary: `Say: "${formatWarningText(warningSeconds)}"`,
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
      <h1 role="timer" aria-label="Time remaining">
        <span style={{ color: phasedResources.timerColor }}>
          {formatTimer(phasedResources.countdownTime)}
        </span>
      </h1>
      <div>
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
              Stop
            </button>
          </>
        )}
      </form>
    </main>
  );
}
