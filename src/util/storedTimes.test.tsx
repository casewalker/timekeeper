import { STORAGE_KEY, readStoredTimes, writeStoredTimes } from "@/util/storedTimes";

beforeEach(() => localStorage.clear());
afterEach(vi.restoreAllMocks);

describe(readStoredTimes, () => {
  it("returns valid stored values", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sharingSeconds: 99, warningSeconds: 11 }));
    const { sharingSeconds, warningSeconds } = readStoredTimes();
    expect(sharingSeconds).toBe(99);
    expect(warningSeconds).toBe(11);
  });

  it("nudges real values to be integers", () => {
    localStorage.setItem(
      STORAGE_KEY,
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
    localStorage.setItem(STORAGE_KEY, data);
    const { sharingSeconds, warningSeconds } = readStoredTimes();
    expect(sharingSeconds).toBe(150);
    expect(warningSeconds).toBe(60);
  });

  it("returns default values when Local Storage throws an error", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sharingSeconds: 99, warningSeconds: 11 }));

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
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ sharingSeconds: 99, warningSeconds: 11 }),
    );
  });

  it("stores invalid values (leave cleanup to the reader)", () => {
    writeStoredTimes({ sharingSeconds: -99, warningSeconds: -11.5 });
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
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
