import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import NumberField from "@/components/NumberField";

describe(NumberField, () => {
  describe("initial render", () => {
    it("displays the value from the parent unchanged", () => {
      render(<NumberField label="Seconds" value={134} onChange={() => {}} />);
      expect(screen.getByLabelText("Seconds")).toHaveValue("134");
    });
  });

  describe("typing", () => {
    it("only commits after tabbing away", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={0} onChange={onChange} />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "46");
      expect(onChange).not.toHaveBeenCalled();

      await user.tab();
      expect(onChange).toHaveBeenCalledExactlyOnceWith(46);
    });

    it("commits on Enter", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={0} onChange={onChange} />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "23{Enter}");
      expect(onChange).toHaveBeenCalledExactlyOnceWith(23);
    });

    it("ignores non-numeric characters", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={1} onChange={onChange} />);

      const input = screen.getByLabelText("Seconds");
      await user.type(input, "abc-.");
      await user.tab();
      expect(onChange).not.toHaveBeenCalled();

      await user.type(input, "wasd2blerg{Enter}");
      expect(onChange).toHaveBeenCalledExactlyOnceWith(12);
    });

    it("allows the field to be emptied and then treats empty as zero", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={29} onChange={onChange} />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      expect(input).toHaveValue("");

      await user.tab();
      expect(onChange).toHaveBeenCalledExactlyOnceWith(0);
    });

    it("displays the parent's normalized value after committing", async () => {
      // Stands in for a timer controller that mods overflowing seconds into minutes
      function ModSixty() {
        const [seconds, setSeconds] = useState(0);
        return (
          <NumberField label="Seconds" value={seconds} onChange={(next) => setSeconds(next % 60)} />
        );
      }
      const user = userEvent.setup();
      render(<ModSixty />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "78");
      await user.tab();

      expect(input).toHaveValue("18");
    });
  });

  describe("step buttons", () => {
    it("increments to the next multiple of step", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={17} step={15} onChange={onChange} />);

      await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith(30);
    });

    it("can increment by 1 too", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={17} step={1} onChange={onChange} />);

      await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith(18);
    });

    it("decrements to the previous multiple of step", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={17} step={15} onChange={onChange} />);

      await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith(15);
    });

    it("can decrement by 1 too", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={17} step={1} onChange={onChange} />);

      await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith(16);
    });

    it("can pass negative values", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Seconds" value={0} step={15} onChange={onChange} />);

      await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith(-15);
    });
  });

  describe("clamping", () => {
    it("doesn't let the value go below min", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Minutes" value={0} min={0} onChange={onChange} />);

      await user.click(screen.getByRole("button", { name: "Decrement Minutes" }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith(0);
    });

    it("reverts to max from larger values", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NumberField label="Minutes" value={0} max={99} onChange={onChange} />);

      const input = screen.getByLabelText("Minutes");
      await user.clear(input);
      await user.type(input, "500{Enter}");
      expect(onChange).toHaveBeenCalledExactlyOnceWith(99);
    });
  });

  describe("disabled", () => {
    it("disables the input and both buttons when disabled", () => {
      render(<NumberField label="Seconds" value={0} disabled onChange={() => {}} />);
      expect(screen.getByLabelText("Seconds")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Increment Seconds" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Decrement Seconds" })).toBeDisabled();
    });
  });
});
