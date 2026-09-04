import { act, renderHook } from "@testing-library/react";
import useCountdown from "@/hooks/useCountdown";

vi.useFakeTimers();

describe(useCountdown, () => {
  it("starts in 'editing' phase with the default remaining time of zero", () => {
    const { result } = renderHook(useCountdown);
    expect(result.current.countdownPhase).toBe("editing");
    expect(result.current.remainingTimerSeconds).toBe(0);
  });

  it("`start` updates the phase to 'running' with the full time remaining", () => {
    const { result } = renderHook(useCountdown);
    act(() => result.current.start(60, 30));

    expect(result.current.countdownPhase).toBe("running");
    expect(result.current.remainingTimerSeconds).toBe(60);
  });

  it("remaining time counts down while running", () => {
    const { result } = renderHook(useCountdown);
    act(() => result.current.start(300, 60));

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remainingTimerSeconds).toBe(299);

    act(() => vi.advanceTimersByTime(59000));
    expect(result.current.remainingTimerSeconds).toBe(240);
  });

  it("switches the phase to 'warning' when remaining time reaches the warning threshold", () => {
    const { result } = renderHook(useCountdown);
    act(() => result.current.start(300, 60));

    act(() => vi.advanceTimersByTime(239000));
    expect(result.current.countdownPhase).toBe("running");
    expect(result.current.remainingTimerSeconds).toBe(61);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.countdownPhase).toBe("warning");
    expect(result.current.remainingTimerSeconds).toBe(60);
  });

  it("goes straight from 'running' to 'finished' when the warning threshold is 0", () => {
    const { result } = renderHook(useCountdown);
    act(() => result.current.start(3, 0));

    act(() => vi.advanceTimersByTime(2999));
    expect(result.current.countdownPhase).toBe("running");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.countdownPhase).toBe("finished");
  });

  it("switches the phase to 'finished' at zero and keeps counting into overtime", () => {
    const { result } = renderHook(useCountdown);
    act(() => result.current.start(1, 0));

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.countdownPhase).toBe("finished");
    expect(result.current.remainingTimerSeconds).toBe(0);

    act(() => vi.advanceTimersByTime(14000));
    expect(result.current.countdownPhase).toBe("finished");
    expect(result.current.remainingTimerSeconds).toBe(-14);

    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.countdownPhase).toBe("finished");
    expect(result.current.remainingTimerSeconds).toBe(-74);
  });

  it("can be restarted at the end", () => {
    const { result } = renderHook(useCountdown);
    act(() => result.current.start(99, 9));
    expect(result.current.countdownPhase).toBe("running");

    act(() => vi.advanceTimersByTime(99000));
    expect(result.current.countdownPhase).toBe("finished");

    act(() => result.current.start(100, 10));
    expect(result.current.countdownPhase).toBe("running");
    expect(result.current.remainingTimerSeconds).toBe(100);
  });

  it("can be restarted part way through a countdown", () => {
    const { result } = renderHook(useCountdown);
    act(() => result.current.start(20, 4));
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.countdownPhase).toBe("running");
    expect(result.current.remainingTimerSeconds).toBe(10);

    act(() => result.current.start(21, 5));
    expect(result.current.countdownPhase).toBe("running");
    expect(result.current.remainingTimerSeconds).toBe(21);
  });

  it("`stop` keeps the 'editing' phase as-is", () => {
    const { result } = renderHook(useCountdown);
    expect(result.current.countdownPhase).toBe("editing");

    act(() => result.current.stop());
    expect(result.current.countdownPhase).toBe("editing");
  });

  it.each([
    ["running", 2000],
    ["warning", 7000],
    ["finished", 10000],
  ])("`stop` returns to 'editing' from other phases (e.g. '%s')", (expectedPhase, advanceTime) => {
    const { result } = renderHook(useCountdown);
    act(() => result.current.start(10, 5));

    act(() => vi.advanceTimersByTime(advanceTime));
    expect(result.current.countdownPhase).toBe(expectedPhase);

    act(() => result.current.stop());
    expect(result.current.countdownPhase).toBe("editing");
  });
});
