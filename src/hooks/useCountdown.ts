import { useEffect, useState } from "react";

export type CountdownPhase = "editing" | "running" | "warning" | "finished";

const TICK_MS = 100;

export default function useCountdown() {
  const [countdownPhase, setCountdownPhase] = useState<CountdownPhase>("editing");
  const [timerDeadline, setTimerDeadline] = useState(0);
  const [remainingTimerSeconds, setRemainingTimerSeconds] = useState(0);
  const [warningSeconds, setWarningSeconds] = useState(0);

  const start = (totalSeconds: number, inputWarningSeconds: number) => {
    setTimerDeadline(Date.now() + totalSeconds * 1000);
    setRemainingTimerSeconds(totalSeconds);
    setWarningSeconds(inputWarningSeconds);
    setCountdownPhase("running");
  };

  const stop = () => {
    setCountdownPhase("editing");
  };

  // Run the countdown until it is finished
  useEffect(() => {
    if (!["running", "warning"].includes(countdownPhase)) return;
    const intervalId = setInterval(() => {
      const nextRemaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
      setRemainingTimerSeconds(nextRemaining);
      if (nextRemaining === 0) {
        setCountdownPhase("finished");
      } else if (nextRemaining <= warningSeconds) {
        setCountdownPhase("warning");
      }
    }, TICK_MS);
    return () => clearInterval(intervalId);
  }, [countdownPhase, timerDeadline, warningSeconds]);

  return { countdownPhase, remainingTimerSeconds, start, stop };
}
