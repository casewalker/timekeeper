import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NumberField from "@/components/NumberField";

describe(NumberField, () => {
  describe("initial render", () => {
    it("displays the value from the parent unchanged", () => {
      render(<NumberField label="Seconds" value={13} onCommit={() => {}} onStep={() => {}} />);
      expect(screen.getByLabelText("Seconds")).toHaveValue("13");
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

    // TODO: Make sure it also blurs
    it("commits on Enter", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<NumberField label="Seconds" value={0} onCommit={onCommit} onStep={() => {}} />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "23{Enter}");
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(23);
    });

    it("performs stepUp when pressing the up arrow", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const onStep = vi.fn();
      render(<NumberField label="Seconds" value={30} onCommit={onCommit} onStep={onStep} />);

      const input = screen.getByLabelText("Seconds");
      await user.type(input, "{ArrowUp}");
      expect(onStep).toHaveBeenCalledExactlyOnceWith("up");
      expect(onCommit).not.toHaveBeenCalled();
    });

    it("performs stepDown when pressing the down arrow", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const onStep = vi.fn();
      render(<NumberField label="Seconds" value={30} onCommit={onCommit} onStep={onStep} />);

      const input = screen.getByLabelText("Seconds");
      await user.type(input, "{ArrowDown}");
      expect(onStep).toHaveBeenCalledExactlyOnceWith("down");
      expect(onCommit).not.toHaveBeenCalled();
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

    it("allows the field to be emptied, and treats empty as zero", async () => {
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
      // Stands in for a timer controller that mods overflowing seconds
      function MockTimerController() {
        const [seconds, setSeconds] = useState(0);
        return (
          <NumberField
            label="Seconds"
            value={seconds}
            onCommit={(next) => setSeconds(next > 59 ? 59 : next)}
            onStep={() => {}}
          />
        );
      }
      const user = userEvent.setup();
      render(<MockTimerController />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "78");
      await user.tab();

      expect(input).toHaveValue("59");
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

  describe("controls", () => {
    it("'pad' adds a leading zero", () => {
      render(<NumberField label="Seconds" value={1} pad onCommit={() => {}} onStep={() => {}} />);
      expect(screen.getByLabelText("Seconds")).toHaveValue("01");
    });

    it("doesn't pad the draft while typing", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<NumberField label="Seconds" value={0} pad onCommit={onCommit} onStep={() => {}} />);

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "1");
      expect(input).toHaveValue("1");

      await user.tab();
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(1);
    });
  });
});
