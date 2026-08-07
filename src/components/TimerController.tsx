import type { StepDirection } from "@/components/NumberField";
import { useId } from "react";
import NumberField from "@/components/NumberField";

export interface TimerControllerProps {
  label: string;
  currentTotalSeconds: number;
  onUpdate: (nextTotalSeconds: number) => void;
  maxTotalSeconds?: number;
  disabled?: boolean;
  error?: string;
}

export default function TimerController({
  label,
  currentTotalSeconds,
  onUpdate,
  maxTotalSeconds,
  disabled = false,
  error,
}: TimerControllerProps) {
  const errorId = useId();
  const minutes = Math.floor(currentTotalSeconds / 60);
  const seconds = currentTotalSeconds % 60;

  const updateTotalSeconds = (nextSeconds: number) => {
    const boundedNextSeconds =
      maxTotalSeconds !== undefined && nextSeconds > maxTotalSeconds
        ? maxTotalSeconds
        : nextSeconds;
    onUpdate(Math.max(0, boundedNextSeconds));
  };

  const commitMinutes = (nextMinutes: number) => {
    updateTotalSeconds(nextMinutes * 60 + seconds);
  };

  const commitSeconds = (nextSeconds: number) => {
    // Clamp seconds to [0, 59]
    updateTotalSeconds(minutes * 60 + Math.min(nextSeconds, 59));
  };

  const stepMinutes = (direction: StepDirection) => {
    if (direction === "down" && currentTotalSeconds < 60) return;
    if (direction === "up") {
      updateTotalSeconds(currentTotalSeconds + 60);
    } else {
      updateTotalSeconds(currentTotalSeconds - 60);
    }
  };

  const stepSeconds = (direction: StepDirection) => {
    // Step seconds by 15 at a time, but also round to the nearest multiple of 15
    if (direction === "up") {
      updateTotalSeconds(15 * (Math.floor(currentTotalSeconds / 15) + 1));
    } else {
      updateTotalSeconds(15 * (Math.ceil(currentTotalSeconds / 15) - 1));
    }
  };

  return (
    <fieldset
      className="timer-controller"
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
    >
      <legend>{label}</legend>
      <NumberField
        label="Minutes"
        value={minutes}
        onCommit={commitMinutes}
        onStep={stepMinutes}
        disabled={disabled}
      />
      <NumberField
        label="Seconds"
        value={seconds}
        onCommit={commitSeconds}
        onStep={stepSeconds}
        disabled={disabled}
      />
      {error && (
        <p id={errorId} role="alert" className="timer-controller__error">
          {error}
        </p>
      )}
      {/* Disabled controls swallow clicks, this shield lets them reach the document dismiss handler */}
      {disabled && <div className="timer-controller__click-shield" aria-hidden="true" />}
    </fieldset>
  );
}
