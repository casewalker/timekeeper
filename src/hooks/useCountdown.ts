import { useEffect, useState } from "react";

export type CountdownPhase = "editing" | "running" | "finished";

const TICK_MS = 200;
const FINISHED_PAUSE_MS = 1000;

export default function useCountdown() {
  const [phase, setPhase] = useState<CountdownPhase>("editing");
  const [deadline, setDeadline] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const start = (totalSeconds: number) => {
    setDeadline(Date.now() + totalSeconds * 1000);
    setRemainingSeconds(totalSeconds);
    setPhase("running");
  };

  const stop = () => {
    setPhase("editing");
  };

  // The deadline, not tick-counting, is the source of truth for the time left,
  // so a delayed or throttled tick can never drift the countdown
  useEffect(() => {
    if (phase !== "running") return;
    const intervalId = setInterval(() => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) {
        setPhase("finished");
      }
    }, TICK_MS);
    return () => clearInterval(intervalId);
  }, [phase, deadline]);

  useEffect(() => {
    if (phase !== "finished") return;
    const timeoutId = setTimeout(() => setPhase("editing"), FINISHED_PAUSE_MS);
    return () => clearTimeout(timeoutId);
  }, [phase]);

  return { phase, remainingSeconds, start, stop };
}
