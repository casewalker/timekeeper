import { useId, useState, type ChangeEvent, type KeyboardEvent } from "react";

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
      commitDraft();
    }
  };

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <div>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={draft ?? String(value)}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
        />
        <button
          type="button"
          aria-label={`Increment ${label}`}
          disabled={disabled}
          onClick={() => onStep("up")}
        >
          <span aria-hidden="true">▲</span>
        </button>
        <button
          type="button"
          aria-label={`Decrement ${label}`}
          disabled={disabled}
          onClick={() => onStep("down")}
        >
          <span aria-hidden="true">▼</span>
        </button>
      </div>
    </div>
  );
}
