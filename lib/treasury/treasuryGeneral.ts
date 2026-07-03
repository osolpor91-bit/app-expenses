export const treasuryMovementTypes = [
  "Ingresos Reales",
  "Ingresos Previstos",
  "Gastos Reales",
  "Gastos Previstos",
] as const;

export type TreasuryMovementType = (typeof treasuryMovementTypes)[number];

export function isTreasuryMovementType(
  value: string
): value is TreasuryMovementType {
  return treasuryMovementTypes.some((type) => type === value);
}
