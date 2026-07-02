import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import { isValidFieldOptionValue } from "@/lib/entityFields/helpers";
import {
  normalizeDecimalField,
  normalizeText,
  normalizeUppercaseText,
  type FieldValidationResult,
  type FieldValidator,
  validateContainsDotField,
  validateCountryCodeField,
  validateDecimalField,
  validateDigitsOnlyField,
  validateEmailListField,
  validateIbanField,
  validatePercentageField,
  validateEmailField,
  validateSmtpPortField,
} from "@/lib/validation/fieldValidations";

export type FieldValidationMessages = Record<string, unknown>;

type RegisteredFieldValidation = {
  messageKey: string;
  validate: (value: string, errorMessage: string) => FieldValidationResult;
};

export const fieldValidationRegistry: Record<
  string,
  RegisteredFieldValidation
> = {
  iban: {
    messageKey: "invalidIban",
    validate: validateIbanField,
  },
  email: {
    messageKey: "invalidEmail",
    validate: validateEmailField,
  },
  emailList: {
    messageKey: "invalidEmailList",
    validate: validateEmailListField,
  },
  percentage: {
    messageKey: "invalidPercentage",
    validate: validatePercentageField,
  },
  containsDot: {
    messageKey: "invalidContainsDot",
    validate: validateContainsDotField,
  },
  digitsOnly: {
    messageKey: "invalidDigitsOnly",
    validate: validateDigitsOnlyField,
  },
  countryCode: {
    messageKey: "invalidCountryCode",
    validate: validateCountryCodeField,
  },
  smtpPort: {
    messageKey: "invalidSmtpPort",
    validate: validateSmtpPortField,
  },
};

function getValidationMessage(
  messages: FieldValidationMessages,
  messageKey: string
) {
  const message = messages[messageKey];

  if (typeof message === "string") {
    return message;
  }

  const fallbackMessage = messages.invalidValue;

  if (typeof fallbackMessage === "string") {
    return fallbackMessage;
  }

  return "El valor informado no es válido.";
}

function normalizeFieldByDefinition(
  field: EntityFieldDefinition,
  value: string
): string {
  if (field.normalization === "uppercase") {
    return normalizeUppercaseText(value);
  }

  if (field.type === "decimal") {
    return normalizeDecimalField(value);
  }

  return normalizeText(value);
}

function validateFieldTypeByDefinition(
  field: EntityFieldDefinition,
  value: string,
  messages: FieldValidationMessages
): FieldValidationResult {
  if (field.type === "decimal") {
    return validateDecimalField(
      value,
      getValidationMessage(messages, "invalidDecimal")
    );
  }

  if (field.type === "integer") {
    return validateDigitsOnlyField(
      value,
      getValidationMessage(messages, "invalidDigitsOnly")
    );
  }

  if (field.type === "option") {
    const normalizedValue = normalizeFieldByDefinition(field, value);

    if (!normalizedValue) {
      if (!field.required) {
        return {
          value: normalizedValue,
          error: null,
        };
      }

      return {
        value: normalizedValue,
        error: getValidationMessage(messages, "invalidOption"),
      };
    }

    if (
      !isValidFieldOptionValue({
        field,
        value: normalizedValue,
      })
    ) {
      return {
        value: normalizedValue,
        error: getValidationMessage(messages, "invalidOption"),
      };
    }

    return {
      value: normalizedValue,
      error: null,
    };
  }

  return {
    value: normalizeFieldByDefinition(field, value),
    error: null,
  };
}

export function validateFieldByDefinition(
  field: EntityFieldDefinition,
  value: string,
  messages: FieldValidationMessages
): FieldValidationResult {
  if (!field.validation) {
    const typeValidationResult = validateFieldTypeByDefinition(
      field,
      value,
      messages
    );

    return {
      value: normalizeFieldByDefinition(field, typeValidationResult.value),
      error: typeValidationResult.error,
    };
  }

  const registeredValidation = fieldValidationRegistry[field.validation];

  if (!registeredValidation) {
    return {
      value: normalizeFieldByDefinition(field, value),
      error: `La validación ${field.validation} no está configurada.`,
    };
  }

  const validationResult = registeredValidation.validate(
    value,
    getValidationMessage(messages, registeredValidation.messageKey)
  );

  return {
    value: normalizeFieldByDefinition(field, validationResult.value),
    error: validationResult.error,
  };
}

export function validateFieldsByDefinitions(
  fields: readonly EntityFieldDefinition[],
  values: Record<string, string | boolean | null | undefined>,
  messages: FieldValidationMessages
): FieldValidationResult {
  for (const field of fields) {
    if (field.type === "boolean") {
      continue;
    }

    const value = String(values[field.dbName] ?? "");
    const validationResult = validateFieldByDefinition(field, value, messages);

    if (validationResult.error) {
      return validationResult;
    }
  }

  return {
    value: "",
    error: null,
  };
}

export function buildFieldValidators(
  fields: readonly EntityFieldDefinition[],
  messages: FieldValidationMessages
): Record<string, FieldValidator> {
  return fields.reduce<Record<string, FieldValidator>>((validators, field) => {
    if (
      !field.validation &&
      field.type !== "decimal" &&
      field.type !== "option" &&
      !field.normalization
    ) {
      return validators;
    }

    validators[field.dbName] = (value) =>
      validateFieldByDefinition(field, value, messages);

    return validators;
  }, {});
}