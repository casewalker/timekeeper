import { useId } from "react";
import type { StepDirection } from "@/components/NumberField";
import NumberField from "@/components/NumberField";
import { getReadableDurationFormat } from "@/util/formatDuration";

export interface TimerControllerProps {
  label: string;
  currentTotalSeconds: number;
  onUpdate: (nextTotalSeconds: number) => void;
  maxTotalSeconds?: number;
  error?: string;
}

export default function TimerController({
  label,
  currentTotalSeconds,
  onUpdate,
  maxTotalSeconds,
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
    <fieldset className="min-w-0" aria-describedby={error ? errorId : undefined}>
      {/* The real legend names the group, but the visible title is a plain span to be styled */}
      <legend className="sr-only">{label}</legend>
      {/* Stacked on a phone */}
      <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-3">
        <span aria-hidden="true" className="text-2xl text-stone-600 dark:text-stone-300">
          {label}:
        </span>
        <div className="flex items-center">
          <NumberField
            label="Minutes"
            maxLength={3}
            value={minutes}
            onCommit={commitMinutes}
            onStep={stepMinutes}
          />
          <span
            aria-hidden="true"
            className="font-numeral -translate-y-0.5 text-4xl text-stone-400 dark:text-stone-500"
          >
            :
          </span>
          <NumberField
            label="Seconds"
            maxLength={2}
            pad={true}
            value={seconds}
            onCommit={commitSeconds}
            onStep={stepSeconds}
          />
        </div>
      </div>
      {/* Either show the readable duration, or show the form error */}
      <div className="mt-1 min-h-4 -translate-y-0.75">
        {error == null ? (
          <p aria-hidden="true" className="text-center text-xs text-stone-500 dark:text-stone-400">
            {getReadableDurationFormat(currentTotalSeconds).toLowerCase()}
          </p>
        ) : (
          <p
            id={errorId}
            role="alert"
            className="text-center text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
