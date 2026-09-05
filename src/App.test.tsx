import { act, render, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import userEvent from "@testing-library/user-event";
import App from "@/App";

vi.useFakeTimers({ shouldAdvanceTime: true });

/** Clear the timer. */
const clearTheTimer = async (user: UserEvent) => {
  await user.clear(getTimer("Share Time").getByLabelText("Minutes"));
  await user.clear(getTimer("Share Time").getByLabelText("Seconds"));
  await user.clear(getTimer("Warning").getByLabelText("Minutes"));
  await user.clear(getTimer("Warning").getByLabelText("Seconds"));
  await user.tab();
};

/** Starts an XX Sharing timer with a YY Warning. */
const startTheTimer = async (
  user: UserEvent,
  sharingMinutes: number,
  sharingSeconds: number,
  warningMinutes: number,
  warningSeconds: number,
) => {
  await clearTheTimer(user);
  await user.type(getTimer("Share Time").getByLabelText("Minutes"), `${sharingMinutes}{Enter}`);
  await user.type(getTimer("Share Time").getByLabelText("Seconds"), `${sharingSeconds}{Enter}`);
  await user.type(getTimer("Warning").getByLabelText("Minutes"), `${warningMinutes}{Enter}`);
  await user.type(getTimer("Warning").getByLabelText("Seconds"), `${warningSeconds}{Enter}`);

  await user.click(screen.getByRole("button", { name: "Start" }));
};

const getTimer = (name: string) => within(screen.getByRole("group", { name }));

describe(App, () => {
  describe("setup", () => {
    it("renders the Sharing and Warning timer controllers with default values", async () => {
      render(<App />);
      expect(screen.getByRole("group", { name: "Share Time" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Warning" })).toBeInTheDocument();

      expect(getTimer("Share Time").getByLabelText("Minutes")).toHaveValue("2");
      expect(getTimer("Share Time").getByLabelText("Seconds")).toHaveValue("30");
      expect(getTimer("Warning").getByLabelText("Minutes")).toHaveValue("1");
      expect(getTimer("Warning").getByLabelText("Seconds")).toHaveValue("00");
    });

    it("renders the Sharing and Warning timer controllers and can be overwritten", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await clearTheTimer(user);

      await user.type(getTimer("Share Time").getByLabelText("Minutes"), "2{Enter}");
      await user.type(getTimer("Share Time").getByLabelText("Seconds"), "12{Enter}");
      await user.type(getTimer("Warning").getByLabelText("Minutes"), "1{Enter}");
      await user.type(getTimer("Warning").getByLabelText("Seconds"), "49{Enter}");

      expect(getTimer("Share Time").getByLabelText("Minutes")).toHaveValue("2");
      expect(getTimer("Share Time").getByLabelText("Seconds")).toHaveValue("12");
      expect(getTimer("Warning").getByLabelText("Minutes")).toHaveValue("1");
      expect(getTimer("Warning").getByLabelText("Seconds")).toHaveValue("49");
    }, 1000_000);

    it("lets the user enter Warning ≥ Sharing time but shows a validation error", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await clearTheTimer(user);
      await user.type(getTimer("Share Time").getByLabelText("Minutes"), "5{Enter}");
      await user.type(getTimer("Warning").getByLabelText("Minutes"), "8{Enter}");

      expect(getTimer("Warning").getByLabelText("Minutes")).toHaveValue("8");
      expect(getTimer("Warning").getByLabelText("Seconds")).toHaveValue("00");
      expect(getTimer("Warning").getByRole("alert")).toBeInTheDocument();
      expect(getTimer("Warning").getByRole("alert").textContent).toBe(
        "Warning can't be longer than Share Time",
      );
    });

    it("removes the validation error when Sharing is bumped higher than Warning", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await clearTheTimer(user);
      await user.type(getTimer("Share Time").getByLabelText("Minutes"), "5{Enter}");
      await user.type(getTimer("Warning").getByLabelText("Minutes"), "5{Enter}");

      expect(getTimer("Warning").getByRole("alert")).toBeInTheDocument();
      expect(getTimer("Warning").getByRole("alert").textContent).toBe(
        "Warning can't be longer than Share Time",
      );

      await user.clear(getTimer("Share Time").getByLabelText("Minutes"));
      await user.type(getTimer("Share Time").getByLabelText("Minutes"), "6{Enter}");
      expect(getTimer("Warning").queryByRole("alert")).not.toBeInTheDocument();
    });

    it("drags the Warning timer down when starting with Warning > Sharing", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);

      await clearTheTimer(user);
      await user.type(getTimer("Share Time").getByLabelText("Minutes"), "2{Enter}");
      await user.type(getTimer("Warning").getByLabelText("Minutes"), "6{Enter}");
      await user.click(screen.getByRole("button", { name: "Start" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(getTimer("Warning").getByLabelText("Minutes")).toHaveValue("2");
      expect(getTimer("Warning").getByLabelText("Seconds")).toHaveValue("00");
    });

    it("leaves the Warning timer alone when the Sharing timer stays above it", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);

      await clearTheTimer(user);
      await user.type(getTimer("Share Time").getByLabelText("Minutes"), "4{Enter}");
      await user.type(getTimer("Warning").getByLabelText("Minutes"), "3{Enter}");

      expect(getTimer("Warning").getByLabelText("Minutes")).toHaveValue("3");
    });

    it("disables Start until the main timer has time on it", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await clearTheTimer(user);

      expect(getTimer("Share Time").getByLabelText("Minutes")).toHaveValue("0");
      expect(getTimer("Share Time").getByLabelText("Seconds")).toHaveValue("00");
      expect(getTimer("Warning").getByLabelText("Minutes")).toHaveValue("0");
      expect(getTimer("Warning").getByLabelText("Seconds")).toHaveValue("00");
      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();

      await user.type(getTimer("Share Time").getByLabelText("Minutes"), "99{Enter}");
      expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    });

    it("does not start the timer when committing a field with Enter", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await clearTheTimer(user);

      await user.type(getTimer("Share Time").getByLabelText("Minutes"), "44{Enter}");

      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
      expect(getTimer("Share Time").getByLabelText("Minutes")).toBeEnabled();
    });
  });

  describe("running", () => {
    it("replaces the Start button with Restart and Cancel", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 5, 0, 1, 0);
      expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("removes the timer inputs", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 5, 0, 1, 0);
      expect(screen.queryByRole("group", { name: "Share Time" })).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Warning" })).not.toBeInTheDocument();
    });

    it("shows the remaining time counting down", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 5, 0, 1, 0);
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");

      await act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent("4:59");

      await act(() => vi.advanceTimersByTime(59000));
      expect(screen.getByRole("timer")).toHaveTextContent("4:00");
    });

    it("counts up past zero into overtime with an accessible name, a hidden 'over time' label, and a sticky 'Say Time' alert", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 0, 2, 0, 1);
      expect(screen.queryByText("over time")).not.toBeInTheDocument();
      expect(screen.getByRole("alert")).not.toHaveTextContent('Say: "Time!"');

      await act(() => vi.advanceTimersByTime(2000));
      expect(screen.getByRole("timer")).toHaveTextContent("0:00");
      expect(screen.queryByText("over time")).not.toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent('Say: "Time!"');

      await act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent("-0:01");
      expect(screen.getByRole("timer")).toHaveAccessibleName("1 Second over time");
      expect(screen.getByText("over time")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("alert")).toHaveTextContent('Say: "Time!"');

      await act(() => vi.advanceTimersByTime(13000));
      expect(screen.getByRole("timer")).toHaveTextContent("-0:14");
      expect(screen.getByRole("timer")).toHaveAccessibleName("14 Seconds over time");
      expect(screen.getByText("over time")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("alert")).toHaveTextContent('Say: "Time!"');

      await act(() => vi.advanceTimersByTime(60000));
      expect(screen.getByRole("timer")).toHaveTextContent("-1:14");
      expect(screen.getByRole("timer")).toHaveAccessibleName("1 Minute and 14 Seconds over time");
      expect(screen.getByText("over time")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("alert")).toHaveTextContent('Say: "Time!"');
    });

    it("the Restart button returns to the full time from overtime", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 5, 0, 1, 0);
      expect(screen.queryByText("over time")).not.toBeInTheDocument();

      await act(() => vi.advanceTimersByTime(330000));
      expect(screen.getByRole("timer")).toHaveTextContent("-0:30");
      expect(screen.queryByText("over time")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Restart" }));
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");
      expect(screen.queryByText("over time")).not.toBeInTheDocument();
    });

    it("the Restart button returns the countdown to the full time, with controls still removed", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 5, 0, 1, 0);
      await act(() => vi.advanceTimersByTime(90000));
      expect(screen.getByRole("timer")).toHaveTextContent("3:30");

      await user.click(screen.getByRole("button", { name: "Restart" }));
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");

      expect(screen.queryByRole("group", { name: "Share Time" })).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Warning" })).not.toBeInTheDocument();
    });

    it("the Cancel button returns to editing with the configured times intact", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 5, 0, 1, 0);
      await act(() => vi.advanceTimersByTime(30000));

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
      expect(getTimer("Share Time").getByLabelText("Minutes")).toHaveValue("5");
      expect(getTimer("Share Time").getByLabelText("Minutes")).toBeEnabled();
      expect(getTimer("Share Time").getByLabelText("Seconds")).toHaveValue("00");
      expect(getTimer("Share Time").getByLabelText("Seconds")).toBeEnabled();
      expect(getTimer("Warning").getByLabelText("Minutes")).toHaveValue("1");
      expect(getTimer("Warning").getByLabelText("Minutes")).toBeEnabled();
      expect(getTimer("Warning").getByLabelText("Seconds")).toHaveValue("00");
      expect(getTimer("Warning").getByLabelText("Seconds")).toBeEnabled();
    });

    it("sets the right timer-color per phase", async () => {
      const getTimerValue = () => screen.getByRole("timer").querySelector("span");

      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 0, 2, 0, 1);
      expect(getTimerValue()).toHaveClass("timer-value--running");

      await act(() => vi.advanceTimersByTime(1000));
      expect(getTimerValue()).toHaveClass("timer-value--warning");

      await act(() => vi.advanceTimersByTime(1000));
      expect(getTimerValue()).toHaveClass("timer-value--finished");
    });
  });

  describe("hero text", () => {
    it("Renders the warning text once the threshold is reached", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 6, 0, 5, 55);
      expect(screen.queryAllByText('Say: "5 Minutes and 55 Seconds"')).toHaveLength(0);
      await act(() => vi.advanceTimersByTime(5000));
      expect(screen.getByText('Say: "5 Minutes and 55 Seconds"')).toBeInTheDocument();
    });

    it("Renders the ending text when the Sharing time is up", async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      await startTheTimer(user, 0, 2, 0, 1);
      expect(screen.queryAllByText('Say: "Time!"')).toHaveLength(0);
      await act(() => vi.advanceTimersByTime(2000));
      expect(screen.getByText('Say: "Time!"')).toBeInTheDocument();
    });
  });
});
