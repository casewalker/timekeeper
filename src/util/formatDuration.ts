/** Spells a duration out in words, e.g. "2 Minutes and 30 Seconds". */
export const getReadableDurationFormat = (seconds: number) => {
  if (seconds === 0) return "0 Seconds";

  const pluralize = (string: string, n: number) => (n === 1 ? string : `${string}s`);

  const numMinutes = Math.floor(seconds / 60);
  const numSeconds = seconds % 60;

  const minutesPart = `${numMinutes > 0 ? numMinutes + " " + pluralize("Minute", numMinutes) : ""}`;
  const secondsPart = `${numSeconds > 0 ? numSeconds + " " + pluralize("Second", numSeconds) : ""}`;

  return `${minutesPart}${numMinutes > 0 && numSeconds > 0 ? " and " : ""}${secondsPart}`;
};
