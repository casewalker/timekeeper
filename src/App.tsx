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
  const { phase, remainingSeconds, start, stop } = useCountdown();
  const isEditing = phase === "editing";

  const handleStart: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    // Invariant: 0 <= warning <= sharing; if warning is too big, silently drag it down
    setWarningSeconds(Math.min(warningSeconds, sharingSeconds));
    start(sharingSeconds);
  };

  return (
    <main>
      <h1 role="timer" aria-label="Time remaining">
        {formatTimer(remainingSeconds)}
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
            <button type="button" onClick={() => start(sharingSeconds)}>
              Restart
            </button>
            <button type="button" onClick={stop}>
              Stop
            </button>
          </>
        )}
      </form>
    </main>
  );
}

export default App;
