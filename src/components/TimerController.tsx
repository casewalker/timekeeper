import { useId } from "react";
import type { StepDirection } from "@/components/NumberField";
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
      className="relative m-0 min-w-0 border-0 p-0"
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
    >
      {/* The real legend names the group, but the visible title is a plain span to be styled */}
      <legend className="sr-only">{label}</legend>
      <div className="flex items-baseline justify-end gap-3">
        <span
          aria-hidden="true"
          className={`text-2xl font-medium ${
            disabled
              ? "text-neutral-400 dark:text-neutral-600"
              : "text-neutral-600 dark:text-neutral-300"
          }`}
        >
          {label}:
        </span>
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-baseline gap-1.5">
            <NumberField
              label="Minutes"
              value={minutes}
              onCommit={commitMinutes}
              onStep={stepMinutes}
              disabled={disabled}
            />
            <span aria-hidden="true" className="text-2xl text-neutral-400 dark:text-neutral-500">
              :
            </span>
            <NumberField
              label="Seconds"
              value={seconds}
              onCommit={commitSeconds}
              onStep={stepSeconds}
              disabled={disabled}
            />
          </div>
          {error && (
            <p
              id={errorId}
              role="alert"
              className="max-w-56 text-xs text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}
        </div>
      </div>
      {/* Disabled controls swallow clicks, this shield lets them reach the 'document dismiss' handler */}
      {disabled && <div className="absolute inset-0" aria-hidden="true" />}
    </fieldset>
  );
}
