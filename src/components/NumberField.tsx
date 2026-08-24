import type { ChangeEvent, KeyboardEvent } from "react";
import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type StepDirection = "up" | "down";

export interface NumberFieldProps {
  label: string;
  value: number;
  onCommit: (next: number) => void;
  onStep: (direction: StepDirection) => void;
  unit: string;
  disabled?: boolean;
}

const isNaturalNumber = (text: string) => /^\d+$/.test(text);

export default function NumberField({
  label,
  value,
  onCommit,
  onStep,
  unit,
  disabled = false,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputId = useId();

  const commitDraft = () => {
    if (draft !== null && isNaturalNumber(draft)) {
      onCommit(Number(draft));
    } else if (draft !== null && draft === "") {
      onCommit(0);
    }
    setDraft(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    if (text === "" || isNaturalNumber(text)) {
      setDraft(text);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      // Avoid submitting the overarching form
      event.preventDefault();
      commitDraft();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onStep(event.key === "ArrowUp" ? "up" : "down");
    }
  };

  // The input field itself — the one obviously-interactive box
  const boxBase =
    "inline-flex items-baseline rounded-lg border bg-white px-2.5 py-1.5 dark:bg-neutral-900";
  const boxEnabled =
    "border-neutral-300 dark:border-neutral-600 " +
    "focus-within:ring-2 focus-within:ring-neutral-900 dark:focus-within:ring-neutral-100";
  const boxDisabled = "border-neutral-200 dark:border-neutral-800";
  const boxClasses = `${boxBase} ${disabled ? boxDisabled : boxEnabled}`;

  const inputClasses =
    "peer w-8 text-right text-lg tabular-nums outline-none disabled:cursor-not-allowed " +
    (disabled ? "text-neutral-400 dark:text-neutral-600" : "text-neutral-900 dark:text-neutral-100");

  // Chevrons float chromeless beside the field, dimmed until hovered
  const chevronButton =
    "flex items-center justify-center px-1 py-1 transition " +
    (disabled
      ? "cursor-not-allowed text-neutral-200 dark:text-neutral-700"
      : "cursor-pointer rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100");

  return (
    <div className="inline-flex items-center my-0.5">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className={boxClasses}>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={draft ?? String(value)}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          className={inputClasses}
        />
        <span
          aria-hidden="true"
          className="ml-1 text-sm text-neutral-400 peer-focus:invisible dark:text-neutral-500"
        >
          {unit}
        </span>
      </div>
      <div className="flex flex-col">
        <button
          type="button"
          aria-label={`Increment ${label}`}
          disabled={disabled}
          onClick={() => onStep("up")}
          className={chevronButton}
        >
          <ChevronUp className="h-2 w-2 stroke-[5px]" />
        </button>
        <button
          type="button"
          aria-label={`Decrement ${label}`}
          disabled={disabled}
          onClick={() => onStep("down")}
          className={chevronButton}
        >
          <ChevronDown className="h-2 w-2 stroke-[5px]" />
        </button>
      </div>
    </div>
  );
}
