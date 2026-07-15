import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimerController from "@/components/TimerController";

// TimerController is a controlled component, so tests drive it through a stateful parent
function MockTimerHarness({ initialTotal = 0, max }: { initialTotal?: number; max?: number }) {
  const [total, setTotal] = useState(initialTotal);
  return (
    <TimerController
      label="Timer"
      currentTotalSeconds={total}
      onUpdate={setTotal}
      maximumSeconds={max}
    />
  );
}

const getMinutesInput = () => screen.getByLabelText("Minutes");
const getSecondsInput = () => screen.getByLabelText("Seconds");

describe(TimerController, () => {
  it("correctly splits the total into minutes and seconds", () => {
    render(<MockTimerHarness initialTotal={125} />);
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("5");
  });

  it("stores valid minutes and seconds as-is", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness />);

    await user.clear(getMinutesInput());
    await user.type(getMinutesInput(), "3{Enter}");
    await user.clear(getSecondsInput());
    await user.type(getSecondsInput(), "30{Enter}");

    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("30");
  });

  it("handles excess seconds-remainder correctly (increment button)", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness initialTotal={169} />);
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("49");

    await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("0");
  });

  it("handles deficient seconds-remainder correctly (decrement button)", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness initialTotal={121} />);
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("1");

    await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
    await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
    expect(getMinutesInput()).toHaveValue("1");
    expect(getSecondsInput()).toHaveValue("45");
  });

  it("increments the minutes while preserving the seconds", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness initialTotal={150} />);

    await user.click(screen.getByRole("button", { name: "Increment Minutes" }));
    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("30");
  });

  it("decrements the minutes while preserving the seconds", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness initialTotal={150} />);

    await user.click(screen.getByRole("button", { name: "Decrement Minutes" }));
    expect(getMinutesInput()).toHaveValue("1");
    expect(getSecondsInput()).toHaveValue("30");
  });

  it("ignores the minutes decrement when the total is under a minute", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness initialTotal={30} />);

    await user.click(screen.getByRole("button", { name: "Decrement Minutes" }));
    expect(getMinutesInput()).toHaveValue("0");
    expect(getSecondsInput()).toHaveValue("30");
  });

  it("clamps typed seconds to 59 instead of rolling into the minutes", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness />);

    await user.type(getSecondsInput(), "75{Enter}");
    expect(getMinutesInput()).toHaveValue("0");
    expect(getSecondsInput()).toHaveValue("59");
  });

  it("leaves the minutes untouched when typed seconds are clamped", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness initialTotal={180} />);

    await user.clear(getSecondsInput());
    await user.type(getSecondsInput(), "123{Enter}");
    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("59");
  });

  it("does not go below zero", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness />);

    await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
    expect(getMinutesInput()).toHaveValue("0");
    expect(getSecondsInput()).toHaveValue("0");
  });

  it("clamps the total to maxTotalSeconds", async () => {
    const user = userEvent.setup();
    render(<MockTimerHarness max={120} />);

    await user.clear(getMinutesInput());
    await user.type(getMinutesInput(), "5{Enter}");

    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("0");
  });

  it("disables both fields and their buttons when disabled", () => {
    render(<TimerController label="Timer" currentTotalSeconds={0} onUpdate={() => {}} disabled />);

    expect(getMinutesInput()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increment Minutes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrement Minutes" })).toBeDisabled();
    expect(getSecondsInput()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increment Seconds" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrement Seconds" })).toBeDisabled();
  });
});
