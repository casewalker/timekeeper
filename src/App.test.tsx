import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

vi.useFakeTimers({ shouldAdvanceTime: true });

/** Starts an XX Sharing timer with a YY Warning. */
const startTheTimer = async (
  sharingMinutes: number,
  sharingSeconds: number,
  warningMinutes: number,
  warningSeconds: number,
) => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), `${sharingMinutes}{Enter}`);
  await user.type(getTimer("Sharing Time").getByLabelText("Seconds"), `${sharingSeconds}{Enter}`);
  await user.type(getTimer("Warning Time").getByLabelText("Minutes"), `${warningMinutes}{Enter}`);
  await user.type(getTimer("Warning Time").getByLabelText("Seconds"), `${warningSeconds}{Enter}`);

  await user.click(screen.getByRole("button", { name: "Start" }));
  return user;
};

const getTimer = (name: string) => within(screen.getByRole("group", { name }));

describe(App, () => {
  describe("setup", () => {
    it("renders the Sharing and Warning timer controllers", async () => {
      render(<App />);
      expect(screen.getByRole("group", { name: "Sharing Time" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Warning Time" })).toBeInTheDocument();

      const user = userEvent.setup();
      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "2{Enter}");
      await user.type(getTimer("Sharing Time").getByLabelText("Seconds"), "12{Enter}");
      await user.type(getTimer("Warning Time").getByLabelText("Minutes"), "1{Enter}");
      await user.type(getTimer("Warning Time").getByLabelText("Seconds"), "49{Enter}");

      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toHaveValue("2");
      expect(getTimer("Sharing Time").getByLabelText("Seconds")).toHaveValue("12");
      expect(getTimer("Warning Time").getByLabelText("Minutes")).toHaveValue("1");
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toHaveValue("49");
    });

    it("lets the user enter Warning time ≥ Sharing time but shows a validation error", async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "5{Enter}");
      await user.type(getTimer("Warning Time").getByLabelText("Minutes"), "8{Enter}");

      expect(getTimer("Warning Time").getByLabelText("Minutes")).toHaveValue("8");
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toHaveValue("0");
      expect(getTimer("Warning Time").getByRole("alert")).toBeInTheDocument();
      expect(getTimer("Warning Time").getByRole("alert").textContent).toBe(
        "Warning Time can't be longer than Sharing Time",
      );
    });

    it("removes the validation error when Sharing is bumped higher than Warning", async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "5{Enter}");
      await user.type(getTimer("Warning Time").getByLabelText("Minutes"), "5{Enter}");

      expect(getTimer("Warning Time").getByRole("alert")).toBeInTheDocument();
      expect(getTimer("Warning Time").getByRole("alert").textContent).toBe(
        "Warning Time can't be longer than Sharing Time",
      );

      await user.clear(getTimer("Sharing Time").getByLabelText("Minutes"));
      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "6{Enter}");
      expect(getTimer("Warning Time").queryByRole("alert")).not.toBeInTheDocument();
    });

    it("drags the Warning timer down when starting with Warning > Sharing", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "2{Enter}");
      await user.type(getTimer("Warning Time").getByLabelText("Minutes"), "6{Enter}");
      await user.click(screen.getByRole("button", { name: "Start" }));

      expect(getTimer("Warning Time").getByLabelText("Minutes")).toHaveValue("2");
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toHaveValue("0");
    });

    it("leaves the Warning timer alone when the Sharing timer stays above it", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "4{Enter}");
      await user.type(getTimer("Warning Time").getByLabelText("Minutes"), "3{Enter}");

      expect(getTimer("Warning Time").getByLabelText("Minutes")).toHaveValue("3");
    });

    it("disables Start until the main timer has time on it", async () => {
      const user = userEvent.setup();
      render(<App />);
      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();

      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "99{Enter}");
      expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    });

    it("does not start the timer when committing a field with Enter", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "44{Enter}");

      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeEnabled();
    });
  });

  describe("running", () => {
    it("replaces the Start button with Restart and Stop", async () => {
      await startTheTimer(5, 0, 1, 0);
      expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    });

    it("Stop is replaced by Edit when time is up", async () => {
      await startTheTimer(5, 0, 1, 0);
      await act(() => vi.advanceTimersByTime(300000));
      expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    });

    it("disables the timer inputs", async () => {
      await startTheTimer(5, 0, 1, 0);
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeDisabled();
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toBeDisabled();
    });

    it("shows the remaining time counting down", async () => {
      await startTheTimer(5, 0, 1, 0);
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");

      await act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent("4:59");

      await act(() => vi.advanceTimersByTime(59000));
      expect(screen.getByRole("timer")).toHaveTextContent("4:00");
    });

    it("the Restart button returns the countdown to the full time, with controls still disabled", async () => {
      const user = await startTheTimer(5, 0, 1, 0);
      await act(() => vi.advanceTimersByTime(90000));
      expect(screen.getByRole("timer")).toHaveTextContent("3:30");

      await user.click(screen.getByRole("button", { name: "Restart" }));
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");

      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeDisabled();
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toBeDisabled();
    });

    it("the Stop button returns to editing with the configured times intact", async () => {
      const user = await startTheTimer(5, 0, 1, 0);
      await act(() => vi.advanceTimersByTime(30000));

      await user.click(screen.getByRole("button", { name: "Stop" }));

      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toHaveValue("5");
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeEnabled();
      expect(getTimer("Sharing Time").getByLabelText("Seconds")).toHaveValue("0");
      expect(getTimer("Sharing Time").getByLabelText("Seconds")).toBeEnabled();
      expect(getTimer("Warning Time").getByLabelText("Minutes")).toHaveValue("1");
      expect(getTimer("Warning Time").getByLabelText("Minutes")).toBeEnabled();
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toHaveValue("0");
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toBeEnabled();
    });

    it("holds at zero until a click anywhere dismisses it", async () => {
      const user = await startTheTimer(5, 0, 1, 0);
      await act(() => vi.advanceTimersByTime(300000));
      expect(screen.getByRole("timer")).toHaveTextContent("0:00");
      expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();

      await act(() => vi.advanceTimersByTime(60000));
      expect(screen.getByRole("timer")).toHaveTextContent("0:00");
      expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();

      await user.click(document.body);
      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeEnabled();
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toHaveValue("5");
    });

    it("dismisses on a click over the disabled form, check form-buttons-don't-dismiss regression", async () => {
      await startTheTimer(5, 0, 1, 0);
      await act(() => vi.advanceTimersByTime(300000));
      expect(screen.getByRole("timer")).toHaveTextContent("0:00");

      // fireEvent, not userEvent; userEvent refuses to click inside a disabled fieldset
      const formShield = document.querySelector(".timer-controller__click-shield");
      assert(formShield !== null);
      fireEvent.click(formShield);

      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeEnabled();
    });

    it("clicking Restart at zero starts a fresh countdown instead of dismissing", async () => {
      const user = await startTheTimer(5, 0, 1, 0);
      await act(() => vi.advanceTimersByTime(300000));

      await user.click(screen.getByRole("button", { name: "Restart" }));
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeDisabled();
    });

    it("sets the right timer-color per phase", async () => {
      const getTimerValue = () => screen.getByRole("timer").querySelector("span");

      const user = await startTheTimer(0, 2, 0, 1);
      expect(getTimerValue()).toHaveClass("timer-value--running");

      await act(() => vi.advanceTimersByTime(1000));
      expect(getTimerValue()).toHaveClass("timer-value--warning");

      await act(() => vi.advanceTimersByTime(1000));
      expect(getTimerValue()).toHaveClass("timer-value--finished");

      await user.click(screen.getByRole("button", { name: "Edit" }));
      expect(getTimerValue()).toHaveClass("timer-value--editing");
    });
  });

  describe("hero text", () => {
    it("Renders a singular of the warning minutes at the right time", async () => {
      await startTheTimer(1, 1, 1, 0);
      expect(screen.queryAllByText("Warning")).toHaveLength(0);
      expect(screen.queryAllByText('Say: "1 Minute"')).toHaveLength(0);
      await act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(screen.getByText('Say: "1 Minute"')).toBeInTheDocument();
    });

    it("Renders a singular of the warning second at the right time", async () => {
      await startTheTimer(0, 2, 0, 1);
      expect(screen.queryAllByText('Say: "1 Second"')).toHaveLength(0);
      await act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText('Say: "1 Second"')).toBeInTheDocument();
    });

    it("Renders a plurals of the warning minutes and seconds at the right time", async () => {
      await startTheTimer(6, 0, 5, 55);
      expect(screen.queryAllByText('Say: "5 Minutes and 55 Seconds"')).toHaveLength(0);
      await act(() => vi.advanceTimersByTime(5000));
      expect(screen.getByText('Say: "5 Minutes and 55 Seconds"')).toBeInTheDocument();
    });

    it("Renders the ending text when the Sharing time is up", async () => {
      await startTheTimer(0, 2, 0, 1);
      expect(screen.queryAllByText("Finished!")).toHaveLength(0);
      expect(screen.queryAllByText('Say: "Time!"')).toHaveLength(0);
      await act(() => vi.advanceTimersByTime(2000));
      expect(screen.getByText("Finished!")).toBeInTheDocument();
      expect(screen.getByText('Say: "Time!"')).toBeInTheDocument();
    });
  });
});
