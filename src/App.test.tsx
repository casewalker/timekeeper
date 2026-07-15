import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

// shouldAdvanceTime lets RTL's internal setTimeout(0) queue-drain fire (it only
// auto-advances under jest fake timers, not vitest), while vi.advanceTimersByTime
// still drives the countdown deterministically.
vi.useFakeTimers({ shouldAdvanceTime: true });

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

    // TODO: This is busted? Maybe it shouldn't be?
    // it("lets the user enter Warning time > Sharing time", async () => {
    //   const user = userEvent.setup();
    //   render(<App/>);
    //
    //   await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "5{Enter}");
    //   await user.type(getTimer("Warning Time").getByLabelText("Minutes"), "8{Enter}");
    //
    //   expect(getTimer("Warning Time").getByLabelText("Minutes")).toHaveValue("8");
    //   expect(getTimer("Warning Time").getByLabelText("Seconds")).toHaveValue("0");
    // });

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
    // Starts a 5:00 Sharing timer with a 1:00 warning
    const startTheTimer = async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(getTimer("Sharing Time").getByLabelText("Minutes"), "5{Enter}");
      await user.type(getTimer("Warning Time").getByLabelText("Minutes"), "1{Enter}");

      await user.click(screen.getByRole("button", { name: "Start" }));
      return user;
    };

    it("replaces Start with Restart and Stop", async () => {
      await startTheTimer();
      expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    });

    it("disables the timer inputs", async () => {
      await startTheTimer();
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeDisabled();
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toBeDisabled();
    });

    it("shows the remaining time counting down", async () => {
      await startTheTimer();
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");

      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent("4:59");

      act(() => vi.advanceTimersByTime(59000));
      expect(screen.getByRole("timer")).toHaveTextContent("4:00");
    });

    it("Restart returns the countdown to the full time, with controls still disabled", async () => {
      const user = await startTheTimer();
      act(() => vi.advanceTimersByTime(90000));
      expect(screen.getByRole("timer")).toHaveTextContent("3:30");

      await user.click(screen.getByRole("button", { name: "Restart" }));
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");

      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeDisabled();
      expect(getTimer("Warning Time").getByLabelText("Seconds")).toBeDisabled();
    });

    it("Stop returns to editing with the configured times intact", async () => {
      const user = await startTheTimer();
      act(() => vi.advanceTimersByTime(30000));

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

    // TODO: Come back to this?
    it("returns to editing about a second after reaching zero", async () => {
      await startTheTimer();
      act(() => vi.advanceTimersByTime(300000));
      expect(screen.getByRole("timer")).toHaveTextContent("0:00");
      expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toBeEnabled();
      expect(getTimer("Sharing Time").getByLabelText("Minutes")).toHaveValue("5");
    });
  });
});
