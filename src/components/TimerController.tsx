import NumberField from "@/components/NumberField";

export interface TimerControllerProps {
  label: string;
  currentTotalSeconds: number;
  onUpdate: (nextTotalSeconds: number) => void;
  maximumSeconds?: number;
  disabled?: boolean;
}

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

  return (
    <fieldset disabled={disabled}>
      {/* TODO: Remove nested "disabled" work, it should be inherited automatically from the fieldset */}
      <legend>{label}</legend>
      <NumberField
        label="Minutes"
        value={minutes}
        min={0}
        onChange={(nextMinutes) => updateTotalSeconds(nextMinutes * 60 + seconds)}
        disabled={disabled}
      />
      <NumberField
        label="Seconds"
        value={seconds}
        step={15}
        onChange={(nextSeconds) => updateTotalSeconds(minutes * 60 + nextSeconds)}
        disabled={disabled}
      />
    </fieldset>
  );
}
