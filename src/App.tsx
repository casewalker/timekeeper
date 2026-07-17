import type { SubmitEventHandler } from "react";
import { useState } from "react";
import TimerController from "@/components/TimerController";
import useCountdown from "@/hooks/useCountdown";
import "@/App.css";

const formatTimer = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;

function App() {
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

  const timeDisplay = () => {
    switch (countdownPhase) {
      case "running":
        return <span style={{ color: "green" }}>{formatTimer(remainingTimerSeconds)}</span>;
      case "warning":
        return <span style={{ color: "orange" }}>{formatTimer(remainingTimerSeconds)}</span>;
      case "finished":
        return <span style={{ color: "red" }}>{formatTimer(remainingTimerSeconds)}</span>;
      case "editing":
      default:
        return <span>{formatTimer(sharingSeconds)}</span>;
    }
  };

  return (
    <main>
      <h1 role="timer" aria-label="Time remaining">
        {timeDisplay()}
      </h1>
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

export default App;
