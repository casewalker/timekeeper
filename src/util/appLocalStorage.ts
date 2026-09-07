export const APP_TIMES_KEY = "spiritual-timekeeper:times";
export const APP_TIMER_STATE_KEY = "spiritual-timekeeper:timerstate";

interface AppTimes {
  sharingSeconds: number;
  warningSeconds: number;
}

interface AppTimerState {
  isRunning: boolean;
  deadlineMs: number;
}

const DEFAULT_SHARING_SECONDS = 150; // 2:30
const DEFAULT_WARNING_SECONDS = 60; // 1:00
const RESUMABLE_OVERTIME_MS = 60 * 60 * 1000; // 1 hour

const DEFAULT_TIMES: AppTimes = {
  sharingSeconds: DEFAULT_SHARING_SECONDS,
  warningSeconds: DEFAULT_WARNING_SECONDS,
};

const INITIAL_STATE: AppTimerState = { isRunning: false, deadlineMs: 0 };

const isValidNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export function readStoredTimes(): AppTimes {
  try {
    const raw = localStorage.getItem(APP_TIMES_KEY);
    if (raw == null) return { ...DEFAULT_TIMES };

    const parsed: unknown = JSON.parse(raw);

    if (
      parsed == null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      !("sharingSeconds" in parsed) ||
      !("warningSeconds" in parsed) ||
      !isValidNumber(parsed.sharingSeconds) ||
      !isValidNumber(parsed.warningSeconds)
    ) {
      return { ...DEFAULT_TIMES };
    }

    return {
      sharingSeconds: Math.floor(parsed.sharingSeconds),
      warningSeconds: Math.floor(parsed.warningSeconds),
    };
  } catch {
    return { ...DEFAULT_TIMES };
  }
}

export function writeStoredTimes(times: AppTimes): void {
  try {
    localStorage.setItem(APP_TIMES_KEY, JSON.stringify(times));
  } catch {
    console.error(
      `Couldn't write values to ${APP_TIMES_KEY} in Local Storage: ${JSON.stringify(times)}`,
    );
  }
}

export function readAppState(): AppTimerState {
  try {
    const raw = localStorage.getItem(APP_TIMER_STATE_KEY);
    if (raw == null) return { ...INITIAL_STATE };

    const parsed: unknown = JSON.parse(raw);

    if (
      parsed == null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      !("isRunning" in parsed) ||
      typeof parsed.isRunning !== "boolean" ||
      !("deadlineMs" in parsed) ||
      !isValidNumber(parsed.deadlineMs)
    ) {
      return { ...INITIAL_STATE };
    }

    if (!parsed.isRunning) return { ...INITIAL_STATE };

    // Reset the state if a timer is long past its deadline
    if (Date.now() - parsed.deadlineMs > RESUMABLE_OVERTIME_MS) return { ...INITIAL_STATE };

    return { isRunning: true, deadlineMs: Math.floor(parsed.deadlineMs) };
  } catch {
    return { ...INITIAL_STATE };
  }
}

export function writeAppState(appState: AppTimerState): void {
  try {
    localStorage.setItem(APP_TIMER_STATE_KEY, JSON.stringify(appState));
  } catch {
    console.error(
      `Couldn't write values to ${APP_TIMER_STATE_KEY} in Local Storage: ${JSON.stringify(appState)}`,
    );
  }
}
