export const STORAGE_KEY = "spiritual-timekeeper:times";

const DEFAULT_SHARING_SECONDS = 150; // 2:30
const DEFAULT_WARNING_SECONDS = 60; // 1:00

interface StoredTimes {
  sharingSeconds: number;
  warningSeconds: number;
}

const DEFAULT_TIMES: StoredTimes = {
  sharingSeconds: DEFAULT_SHARING_SECONDS,
  warningSeconds: DEFAULT_WARNING_SECONDS,
};

const isValidSeconds = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export function readStoredTimes(): StoredTimes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return { ...DEFAULT_TIMES };

    const parsed: unknown = JSON.parse(raw);

    if (
      parsed == null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      !("sharingSeconds" in parsed) ||
      !("warningSeconds" in parsed) ||
      !isValidSeconds(parsed.sharingSeconds) ||
      !isValidSeconds(parsed.warningSeconds)
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

export function writeStoredTimes(times: StoredTimes): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
  } catch {
    console.error(`Couldn't write values to ${STORAGE_KEY} in Local Storage`);
  }
}
