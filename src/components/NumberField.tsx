import type { ChangeEvent, KeyboardEvent } from "react";
import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type StepDirection = "up" | "down";

export interface NumberFieldProps {
  label: string;
  value: number;
  onCommit: (next: number) => void;
  onStep: (direction: StepDirection) => void;
  disabled?: boolean;
}

const isNaturalNumber = (text: string) => /^\d+$/.test(text);

export default function NumberField({
  label,
  value,
  onCommit,
  onStep,
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
    }
  };

  // Fused unit shell
  const unitBase = "inline-flex items-stretch rounded-lg border bg-white dark:bg-neutral-900";
  const unitEnabled =
    "border-neutral-300 dark:border-neutral-600 transition " +
    "shadow-[0_1px_2px_rgba(20,22,30,0.12)] hover:shadow-[0_3px_8px_rgba(20,22,30,0.17)] " +
    "dark:shadow-[0_1px_2px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_3px_10px_rgba(0,0,0,0.6)] " +
    "focus-within:ring-2 focus-within:ring-neutral-900 dark:focus-within:ring-neutral-100";
  const unitDisabled = "border-neutral-200 dark:border-neutral-800";

  const unitClasses = `${unitBase} ${disabled ? unitDisabled : unitEnabled}`;

  const inputClasses =
    "w-12 border-0 bg-transparent py-1.5 pr-2.5 pl-1 text-right text-lg " +
    "tabular-nums outline-none disabled:cursor-not-allowed " +
    (disabled
      ? "text-neutral-400 dark:text-neutral-600"
      : "text-neutral-900 dark:text-neutral-100");

  // Chevron buttons
  const dividerBorder = "border-neutral-300 dark:border-neutral-600";
  const stepButtonBase = "flex flex-1 items-center justify-center px-1 transition";
  const stepButtonEnabled =
    "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-200 " +
    "hover:bg-neutral-300 dark:hover:bg-neutral-600 " +
    "hover:text-neutral-800 dark:hover:text-neutral-100 " +
    "active:bg-[#c4c4c4] active:shadow-[inset_0_1px_2px_rgba(20,22,30,0.18)] " +
    "dark:active:bg-neutral-500 dark:active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]";
  const stepButtonDisabled = "text-neutral-300 dark:text-neutral-700 border-transparent";

  const buttonClasses = `${stepButtonBase} ${
    disabled ? stepButtonDisabled : `${stepButtonEnabled} ${dividerBorder}`
  }`;

  return (
    <div className="flex flex-col items-center gap-px">
      <div className={unitClasses}>
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
        <div className={`flex flex-col ${disabled ? "" : `border-l ${dividerBorder}`}`}>
          <button
            type="button"
            aria-label={`Increment ${label}`}
            disabled={disabled}
            onClick={() => onStep("up")}
            className={`${buttonClasses} rounded-tr-lg border-b`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Decrement ${label}`}
            disabled={disabled}
            onClick={() => onStep("down")}
            className={`${buttonClasses} rounded-br-lg border-t`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-neutral-500 dark:text-neutral-400"
      >
        {label}
      </label>
    </div>
  );
}
