import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NumberField from "@/components/NumberField";

describe(NumberField, () => {
  describe("initial render", () => {
    it("displays the value from the parent unchanged", () => {
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={13}
          onCommit={() => {}}
          onStep={() => {}}
        />,
      );
      expect(screen.getByLabelText("Seconds")).toHaveValue("13");
    });
  });

  describe("typing", () => {
    it("only commits after tabbing away", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={0}
          onCommit={onCommit}
          onStep={() => {}}
        />,
      );

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "46");
      expect(onCommit).not.toHaveBeenCalled();

      await user.tab();
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(46);
    });

    it("commits and blurs on Enter", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={0}
          onCommit={onCommit}
          onStep={() => {}}
        />,
      );

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "23");
      expect(input).toHaveFocus();

      await user.type(input, "{Enter}");
      expect(input).not.toHaveFocus();
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(23);
    });

    it("performs stepUp when pressing the up arrow", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const onStep = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={30}
          onCommit={onCommit}
          onStep={onStep}
        />,
      );

      const input = screen.getByLabelText("Seconds");
      await user.type(input, "{ArrowUp}");
      expect(onStep).toHaveBeenCalledExactlyOnceWith("up");
      expect(onCommit).not.toHaveBeenCalled();
    });

    it("performs stepDown when pressing the down arrow", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const onStep = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={30}
          onCommit={onCommit}
          onStep={onStep}
        />,
      );

      const input = screen.getByLabelText("Seconds");
      await user.type(input, "{ArrowDown}");
      expect(onStep).toHaveBeenCalledExactlyOnceWith("down");
      expect(onCommit).not.toHaveBeenCalled();
    });

    it("shows the stepped value while the field is still focused", async () => {
      // Stands in for a timer controller that steps seconds by 15
      function MockTimerController() {
        const [seconds, setSeconds] = useState(30);
        return (
          <NumberField
            label="Seconds"
            maxLength={2}
            pad
            value={seconds}
            onCommit={setSeconds}
            onStep={(direction) => setSeconds((s) => (direction === "up" ? s + 15 : s - 15))}
          />
        );
      }
      const user = userEvent.setup();
      render(<MockTimerController />);

      const input = screen.getByLabelText("Seconds");
      await user.type(input, "{ArrowUp}");
      expect(input).toHaveFocus();
      expect(input).toHaveValue("45");

      await user.type(input, "{ArrowDown}{ArrowDown}");
      expect(input).toHaveValue("15");

      await user.type(input, "{ArrowDown}");
      expect(input).toHaveValue("00");
    });

    it("ignores non-numeric characters", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={1}
          onCommit={onCommit}
          onStep={() => {}}
        />,
      );

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
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={29}
          onCommit={onCommit}
          onStep={() => {}}
        />,
      );

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
            maxLength={2}
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

  describe("focus", () => {
    it.each([
      ["00", 0, ""],
      ["05", 5, "5"],
      ["30", 30, "30"],
    ])(
      "displays '%s' for the value %i, but on-focus it shows '%s'",
      async (display, value, expected) => {
        const user = userEvent.setup();
        render(
          <NumberField
            label="Seconds"
            maxLength={2}
            pad
            value={value}
            onCommit={() => {}}
            onStep={() => {}}
          />,
        );

        const input = screen.getByLabelText("Seconds");
        expect(input).toHaveValue(display);

        await user.click(input);
        expect(input).toHaveValue(expected);
      },
    );

    it.each([
      [29, "29"],
      [0, "00"],
    ])("doesn't commit when focused and left untouched (%i)", async (value, displayed) => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          pad
          value={value}
          onCommit={onCommit}
          onStep={() => {}}
        />,
      );

      const input = screen.getByLabelText("Seconds");
      await user.click(input);
      await user.tab();
      expect(onCommit).not.toHaveBeenCalled();
      expect(input).toHaveValue(displayed);
    });
  });

  describe("step buttons", () => {
    it("reports an upward step when increment is clicked", async () => {
      const user = userEvent.setup();
      const onStep = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={17}
          onCommit={() => {}}
          onStep={onStep}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
      expect(onStep).toHaveBeenCalledExactlyOnceWith("up");
    });

    it("reports a downward step when decrement is clicked", async () => {
      const user = userEvent.setup();
      const onStep = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={17}
          onCommit={() => {}}
          onStep={onStep}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
      expect(onStep).toHaveBeenCalledExactlyOnceWith("down");
    });

    it("does not commit when stepping", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={0}
          onCommit={onCommit}
          onStep={() => {}}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
      expect(onCommit).not.toHaveBeenCalled();
    });
  });

  describe("controls", () => {
    it("'pad' adds a leading zero", () => {
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={1}
          pad
          onCommit={() => {}}
          onStep={() => {}}
        />,
      );
      expect(screen.getByLabelText("Seconds")).toHaveValue("01");
    });

    it("doesn't pad the draft while typing", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <NumberField
          label="Seconds"
          maxLength={2}
          value={0}
          pad
          onCommit={onCommit}
          onStep={() => {}}
        />,
      );

      const input = screen.getByLabelText("Seconds");
      await user.clear(input);
      await user.type(input, "1");
      expect(input).toHaveValue("1");

      await user.tab();
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(1);
    });
  });
});
