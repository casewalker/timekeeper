import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimerController from "@/components/TimerController";

// TimerController is a controlled component, so tests drive it through a stateful parent
function MockTimerApp({ initialTotal = 0, max }: { initialTotal?: number; max?: number }) {
  const [total, setTotal] = useState(initialTotal);
  return (
    <TimerController
      label="Timer"
      currentTotalSeconds={total}
      onUpdate={setTotal}
      maxTotalSeconds={max}
    />
  );
}

const getMinutesInput = () => screen.getByLabelText("Minutes");
const getSecondsInput = () => screen.getByLabelText("Seconds");

describe(TimerController, () => {
  it("correctly splits the total into minutes and seconds", () => {
    render(<MockTimerApp initialTotal={125} />);
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("05");
  });

  it("stores valid minutes and seconds as-is", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp />);

    await user.clear(getMinutesInput());
    await user.type(getMinutesInput(), "3{Enter}");
    await user.clear(getSecondsInput());
    await user.type(getSecondsInput(), "30{Enter}");

    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("30");
  });

  it("rounds the minutes up correctly (increment seconds button)", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp initialTotal={169} />);
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("49");

    await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("00");

    await user.click(screen.getByRole("button", { name: "Increment Seconds" }));
    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("15");
  });

  it("rounds the minutes down correctly (decrement seconds button)", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp initialTotal={121} />);
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("01");

    await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("00");

    await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
    expect(getMinutesInput()).toHaveValue("1");
    expect(getSecondsInput()).toHaveValue("45");
  });

  it("increments the minutes while preserving the seconds", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp initialTotal={151} />);
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("31");

    await user.click(screen.getByRole("button", { name: "Increment Minutes" }));
    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("31");
  });

  it("decrements the minutes while preserving the seconds", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp initialTotal={152} />);
    expect(getMinutesInput()).toHaveValue("2");
    expect(getSecondsInput()).toHaveValue("32");

    await user.click(screen.getByRole("button", { name: "Decrement Minutes" }));
    expect(getMinutesInput()).toHaveValue("1");
    expect(getSecondsInput()).toHaveValue("32");
  });

  it("ignores the minutes decrement when the total is under a minute", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp initialTotal={33} />);

    await user.click(screen.getByRole("button", { name: "Decrement Minutes" }));
    expect(getMinutesInput()).toHaveValue("0");
    expect(getSecondsInput()).toHaveValue("33");
  });

  it("clamps seconds to 59 instead of rolling into the minutes", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp initialTotal={180} />);
    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("00");

    await user.type(getSecondsInput(), "75{Enter}");
    expect(getMinutesInput()).toHaveValue("3");
    expect(getSecondsInput()).toHaveValue("59");
  });

  it("does not go below zero", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp />);

    await user.click(screen.getByRole("button", { name: "Decrement Minutes" }));
    await user.click(screen.getByRole("button", { name: "Decrement Seconds" }));
    expect(getMinutesInput()).toHaveValue("0");
    expect(getSecondsInput()).toHaveValue("00");
  });

  it("clamps the total to maxTotalSeconds", async () => {
    const user = userEvent.setup();
    render(<MockTimerApp max={119} />);

    await user.clear(getMinutesInput());
    await user.type(getMinutesInput(), "5{Enter}");

    expect(getMinutesInput()).toHaveValue("1");
    expect(getSecondsInput()).toHaveValue("59");
  });

  it("can show an error message and link it to the field group", () => {
    render(
      <TimerController
        label="Timer"
        currentTotalSeconds={0}
        onUpdate={() => {}}
        error="You have done goofed"
      />,
    );

    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("You have done goofed");
    expect(screen.getByRole("group", { name: "Timer" })).toHaveAttribute(
      "aria-describedby",
      message.id,
    );
  });

  it("doesn't render an error message when there is no error", () => {
    render(<TimerController label="Timer" currentTotalSeconds={0} onUpdate={() => {}} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Timer" })).not.toHaveAttribute("aria-describedby");
  });
});
