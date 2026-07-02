import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import { normalizeDecimalField } from "@/lib/validation/fieldValidations";

export function formatDateValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const rawValue = String(value).trim();

  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }

  const dateTimeMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})T/);

  if (dateTimeMatch) {
    const [, year, month, day] = dateTimeMatch;
    return `${day}/${month}/${year}`;
  }

  return rawValue;
}

function parseDecimalValueForDisplay(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return null;
  }

  /*
   * Los valores que llegan desde Supabase/Postgres suelen venir en formato
   * técnico con punto decimal: "1.178", "1.1628", "1234.56".
   *
   * No debemos pasar esos valores por normalizeDecimalField(), porque
   * "1.178" se interpretaría como miles en formato español y acabaría
   * siendo 1178.
   *
   * Si el valor trae coma, asumimos que viene de entrada/formato español.
   */
  const normalizedValue = rawValue.includes(",")
    ? normalizeDecimalField(rawValue)
    : rawValue;

  const numericValue = Number(normalizedValue);

  return Number.isFinite(numericValue) ? numericValue : null;
}

export function formatDecimalValue(value: unknown, decimalScale = 2) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = parseDecimalValueForDisplay(value);

  if (numericValue === null) {
    return String(value);
  }

  const fixedValue = numericValue.toFixed(decimalScale);
  const [integerPart = "0", decimalPart = "00"] = fixedValue.split(".");
  const sign = integerPart.startsWith("-") ? "-" : "";
  const unsignedIntegerPart = sign ? integerPart.slice(1) : integerPart;

  const groupedIntegerPart = unsignedIntegerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "."
  );

  return `${sign}${groupedIntegerPart},${decimalPart}`;
}

export function formatFieldValueForDisplay(
  field: EntityFieldDefinition,
  value: unknown
) {
  if (field.type === "date") {
    return formatDateValue(value);
  }

  if (field.type === "decimal") {
    return formatDecimalValue(value, field.decimalScale ?? 2);
  }

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export function formatFieldValueForInput(
  field: EntityFieldDefinition,
  value: unknown
) {
  if (value === null || value === undefined) {
    return "";
  }

  if (field.type === "decimal") {
    const formattedValue = formatDecimalValue(value, field.decimalScale ?? 2);
    return formattedValue === "-" ? "" : formattedValue;
  }

  return String(value);
}