export const appendUnique = (
  current: string[],
  incoming: string[]
): string[] => [
  ...current,
  ...incoming.filter((item) => !current.includes(item)),
];
