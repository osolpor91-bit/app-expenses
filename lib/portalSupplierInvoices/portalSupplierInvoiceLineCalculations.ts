import { normalizeDecimalField } from "@/lib/validation/fieldValidations";

export type PortalSupplierInvoiceLineCalculationInput = {
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
  changedFieldName?: string | null;
};

export type PortalSupplierInvoiceLineCalculationResult = {
  ok: true;
  payload: Record<string, number | null>;
} | {
  ok: false;
  error: string;
};

const portalSupplierInvoiceLineCalculationFields = new Set([
  "quantity",
  "unit_price",
  "discount_rate",
  "discount_amount",
  "base_amount",
  "vat_rate",
  "vat_amount",
  "equivalence_surcharge_rate",
  "equivalence_surcharge_amount",
  "withholding_rate",
  "withholding_amount",
  "total_amount",
]);

function roundAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseDecimalValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalizedValue = normalizeDecimalField(String(value));

  if (!normalizedValue) {
    return null;
  }

  const numericValue = Number(normalizedValue);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseIntegerValue(value: unknown) {
  const numericValue = parseDecimalValue(value);

  if (numericValue === null) {
    return null;
  }

  if (!Number.isInteger(numericValue)) {
    return null;
  }

  return numericValue;
}

function getValue({
  currentRecord,
  values,
  fieldName,
}: {
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
  fieldName: string;
}) {
  if (Object.prototype.hasOwnProperty.call(values, fieldName)) {
    return values[fieldName];
  }

  return currentRecord?.[fieldName] ?? null;
}

function getQuantity({
  currentRecord,
  values,
}: {
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
}) {
  const quantity = parseIntegerValue(
    getValue({
      currentRecord,
      values,
      fieldName: "quantity",
    })
  );

  return quantity ?? 1;
}

function getUnitPrice({
  currentRecord,
  values,
}: {
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
}) {
  const unitPrice = parseDecimalValue(
    getValue({
      currentRecord,
      values,
      fieldName: "unit_price",
    })
  );

  if (unitPrice !== null) {
    return unitPrice;
  }

  const baseAmount = parseDecimalValue(
    getValue({
      currentRecord,
      values,
      fieldName: "base_amount",
    })
  );

  return baseAmount ?? 0;
}

function getRate({
  currentRecord,
  values,
  fieldName,
}: {
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
  fieldName: string;
}) {
  return (
    parseDecimalValue(
      getValue({
        currentRecord,
        values,
        fieldName,
      })
    ) ?? 0
  );
}

function getAmount({
  currentRecord,
  values,
  fieldName,
}: {
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
  fieldName: string;
}) {
  return (
    parseDecimalValue(
      getValue({
        currentRecord,
        values,
        fieldName,
      })
    ) ?? 0
  );
}

export function isPortalSupplierInvoiceLineCalculationField(
  fieldName: string
) {
  return portalSupplierInvoiceLineCalculationFields.has(fieldName);
}

export function calculatePortalSupplierInvoiceLineAmounts({
  currentRecord = null,
  values,
  changedFieldName = null,
}: PortalSupplierInvoiceLineCalculationInput): PortalSupplierInvoiceLineCalculationResult {
  const quantity = getQuantity({
    currentRecord,
    values,
  });

  const unitPrice = getUnitPrice({
    currentRecord,
    values,
  });

  if (quantity < 0) {
    return {
      ok: false,
      error: "La cantidad no puede ser negativa.",
    };
  }

  const grossAmount = roundAmount(quantity * unitPrice);
  const grossAmountSign = grossAmount < 0 ? -1 : 1;
  const absoluteGrossAmount = Math.abs(grossAmount);

  let discountRate = getRate({
    currentRecord,
    values,
    fieldName: "discount_rate",
  });

  let discountAmount = getAmount({
    currentRecord,
    values,
    fieldName: "discount_amount",
  });

  /*
   * En edición sabemos qué campo ha cambiado mediante changedFieldName.
   *
   * En creación de línea todavía no hay registro guardado y normalmente
   * changedFieldName llega como null. En ese caso, si el usuario ha informado
   * un importe de descuento, damos prioridad a discount_amount y calculamos
   * discount_rate a partir de él.
   *
   * Para líneas negativas de corrección:
   * - discount_rate sigue siendo positivo: 10 = 10%.
   * - discount_amount toma el mismo signo que el bruto.
   *   Ejemplo: bruto -100 y descuento 10% => descuento -10, base -90.
   */
  const discountAmountDrivesCalculation =
    changedFieldName === "discount_amount" ||
    (!changedFieldName && Math.abs(discountAmount) > 0);

  if (discountAmountDrivesCalculation) {
    const absoluteDiscountAmount = Math.abs(discountAmount);

    if (absoluteGrossAmount === 0 && absoluteDiscountAmount > 0) {
      return {
        ok: false,
        error:
          "No se puede informar importe de descuento si la cantidad y el precio no generan importe.",
      };
    }

    discountRate =
      absoluteGrossAmount === 0
        ? 0
        : roundRate((absoluteDiscountAmount / absoluteGrossAmount) * 100);

    discountAmount = roundAmount(absoluteDiscountAmount * grossAmountSign);
  } else {
    discountAmount = roundAmount(
      ((absoluteGrossAmount * discountRate) / 100) * grossAmountSign
    );
  }

  if (discountRate < 0 || discountRate > 100) {
    return {
      ok: false,
      error: "El porcentaje de descuento debe estar entre 0 y 100.",
    };
  }

  if (Math.abs(discountAmount) > absoluteGrossAmount) {
    return {
      ok: false,
      error: "El importe de descuento no puede ser superior al bruto de la línea.",
    };
  }

  const baseAmount = roundAmount(grossAmount - discountAmount);

  const vatRate = getRate({
    currentRecord,
    values,
    fieldName: "vat_rate",
  });

  const equivalenceSurchargeRate = getRate({
    currentRecord,
    values,
    fieldName: "equivalence_surcharge_rate",
  });

  const withholdingRate = getRate({
    currentRecord,
    values,
    fieldName: "withholding_rate",
  });

  if (vatRate < 0 || vatRate > 100) {
    return {
      ok: false,
      error: "El porcentaje de IVA debe estar entre 0 y 100.",
    };
  }

  if (equivalenceSurchargeRate < 0 || equivalenceSurchargeRate > 100) {
    return {
      ok: false,
      error: "El porcentaje de recargo de equivalencia debe estar entre 0 y 100.",
    };
  }

  if (withholdingRate < 0 || withholdingRate > 100) {
    return {
      ok: false,
      error: "El porcentaje de retención debe estar entre 0 y 100.",
    };
  }

  return {
    ok: true,
    payload: {
      quantity,
      unit_price: roundAmount(unitPrice),
      discount_rate: roundRate(discountRate),
      discount_amount: roundAmount(discountAmount),
      base_amount: baseAmount,
      vat_rate: roundRate(vatRate),
      equivalence_surcharge_rate: roundRate(equivalenceSurchargeRate),
      withholding_rate: roundRate(withholdingRate),
    },
  };
}
