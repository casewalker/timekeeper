import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import NumberField from "@/components/NumberField";

describe(NumberField, () => {
  describe("initial render", () => {
    it("displays the value from the parent unchanged", () => {
      render(<NumberField label="Seconds" value={134} onCommit={() => {}} onStep={() => {}} />);
      expect(screen.getByLabelText("Seconds")).toHaveValue("134");
    });
  });

  describe("typing", () => {
    it("only commits after tabbing away", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<NumberField label="Seconds" value={0} onCommit={onCommit} onStep={() => {}} />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "46");
      expect(onCommit).not.toHaveBeenCalled();

      await user.tab();
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(46);
    });

    it("commits on Enter", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<NumberField label="Seconds" value={0} onCommit={onCommit} onStep={() => {}} />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "23{Enter}");
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(23);
    });

    it("ignores non-numeric characters", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<NumberField label="Seconds" value={1} onCommit={onCommit} onStep={() => {}} />);

      const input = screen.getByLabelText("Seconds");
      await user.type(input, "abc-.");
      await user.tab();
      expect(onCommit).not.toHaveBeenCalled();

      await user.type(input, "wasd2blerg{Enter}");
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(12);
    });

    it("allows the field to be emptied and then treats empty as zero", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<NumberField label="Seconds" value={29} onCommit={onCommit} onStep={() => {}} />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      expect(input).toHaveValue("");

      await user.tab();
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(0);
    });

    it("displays the parent's normalized value after committing", async () => {
      // Stands in for a timer controller that mods overflowing seconds into minutes
      function ModSixty() {
        const [seconds, setSeconds] = useState(0);
        return (
          <NumberField
            label="Seconds"
            value={seconds}
            onCommit={(next) => setSeconds(next % 60)}
            onStep={() => {}}
          />
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
    it("reports an upward step when increment is clicked", async () => {
      const user = userEvent.setup();
      const onStep = vi.fn();
      render(<NumberField label="Seconds" value={17} onCommit={() => {}} onStep={onStep} />);

      await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
      expect(onStep).toHaveBeenCalledExactlyOnceWith("up");
    });

    it("reports a downward step when decrement is clicked", async () => {
      const user = userEvent.setup();
      const onStep = vi.fn();
      render(<NumberField label="Seconds" value={17} onCommit={() => {}} onStep={onStep} />);

      await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
      expect(onStep).toHaveBeenCalledExactlyOnceWith("down");
    });

    it("does not commit when stepping", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<NumberField label="Seconds" value={0} onCommit={onCommit} onStep={() => {}} />);

      await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
      expect(onCommit).not.toHaveBeenCalled();
    });
  });

  describe("disabled", () => {
    it("disables the input and both buttons when disabled", () => {
      render(
        <NumberField label="Seconds" value={0} disabled onCommit={() => {}} onStep={() => {}} />,
      );
      expect(screen.getByLabelText("Seconds")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Increment Seconds" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Decrement Seconds" })).toBeDisabled();
    });
  });
});
