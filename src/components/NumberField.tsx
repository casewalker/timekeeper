import { useId, useState, type ChangeEvent, type KeyboardEvent } from "react";

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const isNaturalNumber = (text: string) => /^\d+$/.test(text);

export default function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  disabled = false,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputId = useId();

  const clamp = (next: number) => {
    if (min !== undefined && next < min) return min;
    if (max !== undefined && next > max) return max;
    return next;
  };

  const commitDraft = () => {
    if (draft !== null && isNaturalNumber(draft)) {
      onChange(clamp(Number(draft)));
    } else if (draft !== null && draft === "") {
      onChange(0);
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

  const increment = () => {
    onChange(clamp((Math.floor(value / step) + 1) * step));
  };

  const decrement = () => {
    onChange(clamp((Math.ceil(value / step) - 1) * step));
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
          onClick={increment}
        >
          <span aria-hidden="true">▲</span>
        </button>
        <button
          type="button"
          aria-label={`Decrement ${label}`}
          disabled={disabled}
          onClick={decrement}
        >
          <span aria-hidden="true">▼</span>
        </button>
      </div>
    </div>
  );
}
