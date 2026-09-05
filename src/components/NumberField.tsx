import type { ChangeEvent, KeyboardEvent } from "react";
import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type StepDirection = "up" | "down";

export interface NumberFieldProps {
  label: string;
  value: number;
  onCommit: (next: number) => void;
  onStep: (direction: StepDirection) => void;
  pad?: boolean;
  maxLength: number;
}

const isNaturalNumber = (text: string) => /^\d+$/.test(text);

export default function NumberField({
  label,
  value,
  onCommit,
  onStep,
  pad = false,
  maxLength,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputId = useId();

  const commitDraft = () => {
    if (draft !== null && (draft === "" || isNaturalNumber(draft))) {
      const newValue = draft === "" ? 0 : Number(draft);
      if (newValue !== value) {
        onCommit(newValue);
      }
    }
    setDraft(null);
  };

  // Remove leading zeros, down to nothing in the case of "00"
  const handleFocus = () => setDraft(value === 0 ? "" : String(value));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    if (text === "" || isNaturalNumber(text)) {
      setDraft(text);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      // Commit + Exit the input via blur
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      // Treat as if pressing the up or down buttons
      event.preventDefault();
      setDraft(null);
      onStep(event.key === "ArrowUp" ? "up" : "down");
    }
  };

  const boxClasses =
    "flex w-full cursor-text justify-center rounded-xl px-1 py-1 transition-colors " +
    "hover:bg-stone-500/10 focus-within:bg-stone-500/10 " +
    "focus-within:ring-2 focus-within:ring-stone-800 dark:focus-within:ring-stone-100";

  const inputClasses =
    "w-17 cursor-text bg-transparent text-center font-numeral text-4xl lining-nums tabular-nums " +
    "-translate-y-0.5 outline-none text-stone-800 dark:text-stone-100";

  const stepButtonClasses =
    "flex h-6 w-full cursor-pointer items-center justify-center rounded-md transition-colors " +
    "text-stone-400 hover:bg-stone-500/10 hover:text-stone-800 " +
    "active:bg-stone-500/20 dark:text-stone-500 dark:hover:text-stone-100";

  const possiblyPaddedValue = draft ?? (pad ? String(value).padStart(2, "0") : String(value));

  return (
    <div className="inline-flex w-19 flex-col items-center">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <button
        type="button"
        aria-label={`Increment ${label}`}
        onClick={() => onStep("up")}
        className={stepButtonClasses}
      >
        <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <div className={boxClasses}>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          maxLength={maxLength}
          value={possiblyPaddedValue}
          onFocus={handleFocus}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          className={inputClasses}
          autoComplete="off"
        />
      </div>
      <button
        type="button"
        aria-label={`Decrement ${label}`}
        onClick={() => onStep("down")}
        className={stepButtonClasses}
      >
        <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
