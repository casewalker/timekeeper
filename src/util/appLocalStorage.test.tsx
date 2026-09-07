import {
  APP_TIMER_STATE_KEY,
  APP_TIMES_KEY,
  readAppState,
  readStoredTimes,
  writeAppState,
  writeStoredTimes,
} from "@/util/appLocalStorage";

const NOW = 1767225600000; // new Date("2026-01-01T00:00:00Z")

vi.useFakeTimers({ now: NOW });
beforeEach(() => localStorage.clear());
afterEach(vi.restoreAllMocks);

describe(readStoredTimes, () => {
  it("returns valid stored values", () => {
    localStorage.setItem(APP_TIMES_KEY, JSON.stringify({ sharingSeconds: 99, warningSeconds: 11 }));
    const { sharingSeconds, warningSeconds } = readStoredTimes();
    expect(sharingSeconds).toBe(99);
    expect(warningSeconds).toBe(11);
  });

  it("nudges real values to be integers", () => {
    localStorage.setItem(
      APP_TIMES_KEY,
      JSON.stringify({ sharingSeconds: 99.678, warningSeconds: 11.123 }),
    );
    const { sharingSeconds, warningSeconds } = readStoredTimes();
    expect(sharingSeconds).toBe(99);
    expect(warningSeconds).toBe(11);
  });

  it("returns default values when nothing is stored", () => {
    const { sharingSeconds, warningSeconds } = readStoredTimes();
    expect(sharingSeconds).toBe(150);
    expect(warningSeconds).toBe(60);
  });

  it("returns default values when something got stored on the wrong key", () => {
    localStorage.setItem("wrong-key", JSON.stringify({ sharingSeconds: 99, warningSeconds: 11 }));
    const { sharingSeconds, warningSeconds } = readStoredTimes();
    expect(sharingSeconds).toBe(150);
    expect(warningSeconds).toBe(60);
  });

  it.each([
    "foo",
    JSON.stringify("bar"),
    JSON.stringify(true),
    JSON.stringify(23),
    JSON.stringify({ sharingSeconds: -1, warningSeconds: 11 }),
    JSON.stringify({ sharingSeconds: 99, warningSeconds: -1 }),
    JSON.stringify({ sharingSeconds: "Bilbo", warningSeconds: 11 }),
    JSON.stringify({ sharingSeconds: 99, warningSeconds: "Baggins" }),
    '{"sharingSeconds": 2, "warningSeconds": 1]',
    JSON.stringify({ sharingSeconds: 2, warning: 1 }),
    JSON.stringify({ sharing: 2, warningSeconds: 1 }),
    JSON.stringify(["sharingSeconds", 2, "warningSeconds", 1]),
  ])("returns default values when stored data is invalid (%s)", (data) => {
    localStorage.setItem(APP_TIMES_KEY, data);
    const { sharingSeconds, warningSeconds } = readStoredTimes();
    expect(sharingSeconds).toBe(150);
    expect(warningSeconds).toBe(60);
  });

  it("returns default values when Local Storage throws an error", () => {
    localStorage.setItem(APP_TIMES_KEY, JSON.stringify({ sharingSeconds: 99, warningSeconds: 11 }));

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("LocalStorageError");
    });

    const { sharingSeconds, warningSeconds } = readStoredTimes();
    expect(sharingSeconds).toBe(150);
    expect(warningSeconds).toBe(60);
  });
});

describe(writeStoredTimes, () => {
  it("stores valid values", () => {
    writeStoredTimes({ sharingSeconds: 99, warningSeconds: 11 });
    expect(localStorage.getItem(APP_TIMES_KEY)).toBe(
      JSON.stringify({ sharingSeconds: 99, warningSeconds: 11 }),
    );
  });

  it("stores invalid values (leave cleanup to the reader)", () => {
    writeStoredTimes({ sharingSeconds: -99, warningSeconds: -11.5 });
    expect(localStorage.getItem(APP_TIMES_KEY)).toBe(
      JSON.stringify({ sharingSeconds: -99, warningSeconds: -11.5 }),
    );
  });

  it("doesn't throw even if Local Storage throws an error", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("LocalStorageError");
    });
    expect(() => writeStoredTimes({ sharingSeconds: 99, warningSeconds: 11 })).not.toThrow();
  });
});

describe(readAppState, () => {
  it("returns a running session that hasn't reached its deadline", () => {
    const deadlineMs = NOW + 90_000;
    localStorage.setItem(APP_TIMER_STATE_KEY, JSON.stringify({ isRunning: true, deadlineMs }));
    expect(readAppState()).toEqual({ isRunning: true, deadlineMs });
  });

  it("returns a running session that is in overtime", () => {
    const deadlineMs = NOW - 90_000;
    localStorage.setItem(APP_TIMER_STATE_KEY, JSON.stringify({ isRunning: true, deadlineMs }));
    expect(readAppState()).toEqual({ isRunning: true, deadlineMs });
  });

  it("nudges real values to be integers", () => {
    const deadlineMs = NOW + 90_000.7;
    localStorage.setItem(APP_TIMER_STATE_KEY, JSON.stringify({ isRunning: true, deadlineMs }));
    expect(readAppState()).toEqual({ isRunning: true, deadlineMs: NOW + 90_000 });
  });

  it("resets a session left more than an hour past its deadline", () => {
    const deadlineMs = NOW - 60 * 60 * 1000 - 1000;
    localStorage.setItem(APP_TIMER_STATE_KEY, JSON.stringify({ isRunning: true, deadlineMs }));
    expect(readAppState()).toEqual({ isRunning: false, deadlineMs: 0 });
  });

  it("returns the defaults when nothing is stored", () => {
    expect(readAppState()).toEqual({ isRunning: false, deadlineMs: 0 });
  });

  it("returns the defaults when something got stored on the wrong key", () => {
    const deadlineMs = NOW + 90_000;
    localStorage.setItem("wrong-key", JSON.stringify({ isRunning: true, deadlineMs }));
    expect(readAppState()).toEqual({ isRunning: false, deadlineMs: 0 });
  });

  it("returns the defaults if the session isn't running", () => {
    const deadlineMs = NOW + 90_000;
    localStorage.setItem("wrong-key", JSON.stringify({ isRunning: false, deadlineMs }));
    expect(readAppState()).toEqual({ isRunning: false, deadlineMs: 0 });
  });

  it.each([
    "foo",
    JSON.stringify("bar"),
    JSON.stringify(true),
    JSON.stringify(1767225605000),
    JSON.stringify({ isRunning: "yes", deadlineMs: 1767225605000 }),
    JSON.stringify({ isRunning: true, deadlineMs: -1 }),
    JSON.stringify({ isRunning: true, deadlineMs: "death-cab" }),
    '{"isRunning": true, "deadlineMs": 1767225605000]',
    JSON.stringify({ deadlineMs: 1767225605000 }),
    JSON.stringify({ isRunning: true }),
    JSON.stringify([true, 1767225605000]),
  ])("returns the defaults when stored data is invalid (%s)", (data) => {
    localStorage.setItem(APP_TIMER_STATE_KEY, data);
    expect(readAppState()).toEqual({ isRunning: false, deadlineMs: 0 });
  });

  it("returns the defaults when Local Storage throws an error", () => {
    const deadlineMs = NOW + 90_000;
    localStorage.setItem("wrong-key", JSON.stringify({ isRunning: true, deadlineMs }));

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("LocalStorageError");
    });

    expect(readAppState()).toEqual({ isRunning: false, deadlineMs: 0 });
  });
});

describe(writeAppState, () => {
  it("stores valid values", () => {
    writeAppState({ isRunning: false, deadlineMs: 1767225605000 });
    expect(localStorage.getItem(APP_TIMER_STATE_KEY)).toBe(
      JSON.stringify({ isRunning: false, deadlineMs: 1767225605000 }),
    );
  });

  it("stores invalid values (leave cleanup to the reader)", () => {
    writeAppState({ isRunning: true, deadlineMs: -1 });
    expect(localStorage.getItem(APP_TIMER_STATE_KEY)).toBe(
      JSON.stringify({ isRunning: true, deadlineMs: -1 }),
    );
  });

  it("doesn't throw even if Local Storage throws an error", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("LocalStorageError");
    });
    expect(() => writeAppState({ isRunning: true, deadlineMs: 1767225605000 })).not.toThrow();
  });
});
