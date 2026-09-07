import { useEffect, useState } from "react";
import { readAppState, readStoredTimes, writeAppState } from "@/util/appLocalStorage";

export type CountdownPhase = "editing" | "running" | "warning" | "finished";

const TICK_MS = 100;

const secondsUntil = (deadlineMs: number) => Math.ceil((deadlineMs - Date.now()) / 1000);

const phaseFor = (remainingSeconds: number, warningSeconds: number): CountdownPhase =>
  remainingSeconds <= 0 ? "finished" : remainingSeconds <= warningSeconds ? "warning" : "running";

export default function useCountdown() {
  const initialState = readAppState();
  const storedTimes = readStoredTimes();
  const [timerDeadline, setTimerDeadline] = useState(initialState.deadlineMs);
  const [remainingTimerSeconds, setRemainingTimerSeconds] = useState(() =>
    initialState.isRunning ? secondsUntil(timerDeadline) : 0,
  );
  const [warningSeconds, setWarningSeconds] = useState(storedTimes.warningSeconds);
  const [countdownPhase, setCountdownPhase] = useState<CountdownPhase>(() =>
    initialState.isRunning ? phaseFor(remainingTimerSeconds, warningSeconds) : "editing",
  );

  const start = (totalSeconds: number, inputWarningSeconds: number) => {
    const deadlineMs = Date.now() + totalSeconds * 1000;
    writeAppState({ isRunning: true, deadlineMs });
    setTimerDeadline(deadlineMs);
    setRemainingTimerSeconds(totalSeconds);
    setWarningSeconds(inputWarningSeconds);
    setCountdownPhase("running");
  };

  const stop = () => {
    writeAppState({ isRunning: false, deadlineMs: 0 });
    setCountdownPhase("editing");
  };

  // Run the countdown, and keep ticking past zero into overtime once finished
  useEffect(() => {
    if (countdownPhase === "editing") return;
    const intervalId = setInterval(() => {
      const nextRemainingTimerSeconds = secondsUntil(timerDeadline);
      setRemainingTimerSeconds(nextRemainingTimerSeconds);
      setCountdownPhase(phaseFor(nextRemainingTimerSeconds, warningSeconds));
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [countdownPhase, timerDeadline, warningSeconds]);

  return { countdownPhase, remainingTimerSeconds, start, stop };
}
