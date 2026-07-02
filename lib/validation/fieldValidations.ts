export type FieldValidationResult = {
  value: string;
  error: string | null;
};

export type FieldValidator = (value: string) => FieldValidationResult;

function valid(value: string): FieldValidationResult {
  return {
    value,
    error: null,
  };
}

function invalid(value: string, error: string): FieldValidationResult {
  return {
    value,
    error,
  };
}

export function normalizeText(value: string): string {
  return value.trim();
}

export function normalizeUppercaseText(value: string): string {
  return normalizeText(value).toUpperCase();
}

export function normalizeIban(value: string): string {
  return value.replace(/[\s-]+/g, "").toUpperCase();
}

function getIbanNumericRepresentation(iban: string): string | null {
  const rearrangedIban = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let numericIban = "";

  for (const character of rearrangedIban) {
    if (/\d/.test(character)) {
      numericIban += character;
      continue;
    }

    if (/[A-Z]/.test(character)) {
      numericIban += String(character.charCodeAt(0) - 55);
      continue;
    }

    return null;
  }

  return numericIban;
}

function mod97(numericValue: string): number {
  let remainder = 0;

  for (const digit of numericValue) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder;
}

export function isValidIban(value: string): boolean {
  const iban = normalizeIban(value);

  if (!iban) {
    return true;
  }

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) {
    return false;
  }

  const numericIban = getIbanNumericRepresentation(iban);

  if (!numericIban) {
    return false;
  }

  return mod97(numericIban) === 1;
}

export function validateIbanField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const iban = normalizeIban(value);

  if (!iban) {
    return valid(iban);
  }

  if (!isValidIban(iban)) {
    return invalid(iban, errorMessage);
  }

  return valid(iban);
}
export function validateEmailField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return valid(normalizedValue);
  }

  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!emailPattern.test(normalizedValue)) {
    return invalid(normalizedValue, errorMessage);
  }

  return valid(normalizedValue);
}

export function validateSmtpPortField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return valid(normalizedValue);
  }

  if (!/^\d+$/.test(normalizedValue)) {
    return invalid(normalizedValue, errorMessage);
  }

  const port = Number(normalizedValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return invalid(normalizedValue, errorMessage);
  }

  return valid(normalizedValue);
}

export function validateEmailListField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const normalizedValue = value
    .split(";")
    .map((email) => email.trim().toLowerCase())
    .join(";");

  if (!normalizedValue) {
    return valid(normalizedValue);
  }

  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  const emails = normalizedValue.split(";");

  const isValid = emails.every((email) => {
    return Boolean(email) && emailPattern.test(email);
  });

  if (!isValid) {
    return invalid(normalizedValue, errorMessage);
  }

  return valid(normalizedValue);
}

export function normalizeDecimalField(value: string): string {
  const trimmedValue = value.trim().replace(/\s+/g, "");

  if (!trimmedValue) {
    return "";
  }

  const sign = trimmedValue.startsWith("-") ? "-" : "";
  const unsignedValue = sign ? trimmedValue.slice(1) : trimmedValue;

  if (unsignedValue.includes(",")) {
    return `${sign}${unsignedValue.replace(/\./g, "").replace(",", ".")}`;
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(unsignedValue)) {
    return `${sign}${unsignedValue.replace(/\./g, "")}`;
  }

  return `${sign}${unsignedValue}`;
}

export function validateDecimalField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const normalizedValue = normalizeDecimalField(value);

  if (!normalizedValue) {
    return valid(normalizedValue);
  }

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    return invalid(normalizedValue, errorMessage);
  }

  return valid(normalizedValue);
}

export function validatePercentageField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const normalizedValue = normalizeDecimalField(value);

  if (!normalizedValue) {
    return valid(normalizedValue);
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    return invalid(normalizedValue, errorMessage);
  }

  const numericValue = Number(normalizedValue);

  if (numericValue < 0 || numericValue > 100) {
    return invalid(normalizedValue, errorMessage);
  }

  return valid(normalizedValue);
}

export function validateContainsDotField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return valid(normalizedValue);
  }

  if (!normalizedValue.includes(".")) {
    return invalid(normalizedValue, errorMessage);
  }

  return valid(normalizedValue);
}

export function validateDigitsOnlyField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return valid(normalizedValue);
  }

  if (!/^\d+$/.test(normalizedValue)) {
    return invalid(normalizedValue, errorMessage);
  }

  return valid(normalizedValue);
}

export function validateCountryCodeField(
  value: string,
  errorMessage: string
): FieldValidationResult {
  const normalizedValue = normalizeUppercaseText(value);

  if (!normalizedValue) {
    return valid(normalizedValue);
  }

  if (!/^[A-Z]{2}$/.test(normalizedValue)) {
    return invalid(normalizedValue, errorMessage);
  }

  return valid(normalizedValue);
}