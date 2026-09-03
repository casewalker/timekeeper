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
}

const isNaturalNumber = (text: string) => /^\d+$/.test(text);

export default function NumberField({
  label,
  value,
  onCommit,
  onStep,
  pad = false,
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

  const boxClasses =
    "flex w-full cursor-text justify-center rounded-xl px-1 py-1 transition-colors " +
    "hover:bg-stone-500/10 focus-within:bg-stone-500/10 " +
    "focus-within:ring-2 focus-within:ring-stone-800 dark:focus-within:ring-stone-100";

  const inputClasses =
    "w-14 cursor-text bg-transparent text-center font-numeral text-4xl lining-nums tabular-nums " +
    "outline-none text-stone-800 dark:text-stone-100";

  const stepButtonClasses =
    "flex h-6 w-full cursor-pointer items-center justify-center rounded-md transition-colors " +
    "text-stone-400 hover:bg-stone-500/10 hover:text-stone-800 " +
    "active:bg-stone-500/20 dark:text-stone-500 dark:hover:text-stone-100";

  const possiblyPaddedValue = draft ?? (pad ? String(value).padStart(2, "0") : String(value));

  return (
    <div className="inline-flex w-16 flex-col items-center">
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
          value={possiblyPaddedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          className={inputClasses}
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
