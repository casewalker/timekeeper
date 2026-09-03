import { getReadableDurationFormat } from "@/util/formatDuration";

describe(getReadableDurationFormat, () => {
  it.each([
    // Seconds - singular, plural, no "and" joiner
    [0, "0 Seconds"],
    [1, "1 Second"],
    [2, "2 Seconds"],
    [59, "59 Seconds"],
    // Whole minutes - no seconds, no "and" joiner
    [60, "1 Minute"],
    [120, "2 Minutes"],
    // Both units - singulars, plurals, mixed, a few extra examples
    [61, "1 Minute and 1 Second"],
    [62, "1 Minute and 2 Seconds"],
    [121, "2 Minutes and 1 Second"],
    [150, "2 Minutes and 30 Seconds"],
    [355, "5 Minutes and 55 Seconds"],
  ])("spells %i out as '%s'", (seconds, expected) => {
    expect(getReadableDurationFormat(seconds)).toBe(expected);
  });
});
