export function getDepartureYears(baseYear: number, span: number): number[] {
  return Array.from({ length: span }, (_, index) => baseYear + index);
}
