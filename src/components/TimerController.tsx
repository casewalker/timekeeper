import NumberField, { type StepDirection } from "@/components/NumberField";

export interface TimerControllerProps {
  label: string;
  currentTotalSeconds: number;
  onUpdate: (nextTotalSeconds: number) => void;
  maximumSeconds?: number;
  disabled?: boolean;
}

const SECONDS_STEP = 15;

export default function TimerController({
  label,
  currentTotalSeconds,
  onUpdate,
  maximumSeconds,
  disabled = false,
}: TimerControllerProps) {
  const minutes = Math.floor(currentTotalSeconds / 60);
  const seconds = currentTotalSeconds % 60;

  const updateTotalSeconds = (nextSeconds: number) => {
    const boundedNextSeconds =
      maximumSeconds !== undefined && nextSeconds > maximumSeconds ? maximumSeconds : nextSeconds;
    onUpdate(Math.max(0, boundedNextSeconds));
  };

  const commitMinutes = (nextMinutes: number) => {
    updateTotalSeconds(nextMinutes * 60 + seconds);
  };

  const commitSeconds = (nextSeconds: number) => {
    updateTotalSeconds(minutes * 60 + Math.min(nextSeconds, 59));
  };

  const stepMinutes = (direction: StepDirection) => {
    if (direction === "down" && currentTotalSeconds < 60) return;
    updateTotalSeconds(currentTotalSeconds + (direction === "up" ? 60 : -60));
  };

  // Snapping the total to a multiple of the step matches snapping the seconds
  // field with minute-rollover, because the step divides 60 evenly
  const stepSeconds = (direction: StepDirection) => {
    const nextMultiple =
      direction === "up"
        ? Math.floor(currentTotalSeconds / SECONDS_STEP) + 1
        : Math.ceil(currentTotalSeconds / SECONDS_STEP) - 1;
    updateTotalSeconds(nextMultiple * SECONDS_STEP);
  };

  return (
    <fieldset disabled={disabled}>
      <legend>{label}</legend>
      <NumberField label="Minutes" value={minutes} onCommit={commitMinutes} onStep={stepMinutes} />
      <NumberField label="Seconds" value={seconds} onCommit={commitSeconds} onStep={stepSeconds} />
    </fieldset>
  );
}
