import type { SupabaseServerClient } from "@/lib/entities/core/entityRepository";
import { currencyOptions } from "@/lib/entityFields/commonOptions";
import { getEcbExchangeRate } from "@/lib/exchangeRates/ecbExchangeRateProvider";
import {
  findExchangeRate,
  getExchangeRateNumber,
  upsertExchangeRate,
} from "@/lib/exchangeRates/exchangeRateRepository";

export type GetExchangeRateInput = {
  supabase: SupabaseServerClient;
  tenantId: string;
  date: Date | string;
  referenceCurrencyCode: string | null | undefined;
  exchangeCurrencyCode: string | null | undefined;
};

const allowedCurrencyCodes = new Set<string>(
  currencyOptions.map((option) => option.value)
);

function normalizeCurrencyCode(value: string | null | undefined) {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  return allowedCurrencyCodes.has(normalizedValue) ? normalizedValue : "";
}

function normalizeExchangeDate(value: Date | string) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("La fecha para el tipo de cambio no es válida.");
    }

    return value.toISOString().slice(0, 10);
  }

  const normalizedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw new Error("La fecha para el tipo de cambio no es válida.");
  }

  return normalizedValue;
}

export async function getExchangeRate({
  supabase,
  tenantId,
  date,
  referenceCurrencyCode,
  exchangeCurrencyCode,
}: GetExchangeRateInput): Promise<number | null> {
  const normalizedReferenceCurrencyCode = normalizeCurrencyCode(
    referenceCurrencyCode
  );
  const normalizedExchangeCurrencyCode = normalizeCurrencyCode(
    exchangeCurrencyCode
  );

  if (!normalizedReferenceCurrencyCode) {
    throw new Error("La divisa de referencia no es válida.");
  }

  if (!normalizedExchangeCurrencyCode) {
    throw new Error("La divisa de cambio no es válida.");
  }

  if (normalizedReferenceCurrencyCode === normalizedExchangeCurrencyCode) {
    return null;
  }

  const exchangeDate = normalizeExchangeDate(date);

  const cachedResult = await findExchangeRate({
    supabase,
    lookup: {
      tenantId,
      referenceCurrencyCode: normalizedReferenceCurrencyCode,
      exchangeCurrencyCode: normalizedExchangeCurrencyCode,
      exchangeDate,
      source: "ECB",
    },
  });

  if (cachedResult.error) {
    throw new Error(
      cachedResult.error.message ??
        "No se ha podido leer la tabla de tipos de cambio."
    );
  }

  if (cachedResult.data) {
    const cachedExchangeRate = getExchangeRateNumber(cachedResult.data);

    if (cachedExchangeRate) {
      return cachedExchangeRate;
    }
  }

  const officialExchangeRate = await getEcbExchangeRate({
    exchangeDate,
    referenceCurrencyCode: normalizedReferenceCurrencyCode,
    exchangeCurrencyCode: normalizedExchangeCurrencyCode,
  });

  const upsertResult = await upsertExchangeRate({
    supabase,
    input: {
      tenantId,
      referenceCurrencyCode: normalizedReferenceCurrencyCode,
      exchangeCurrencyCode: normalizedExchangeCurrencyCode,
      exchangeDate,
      sourceExchangeDate: officialExchangeRate.sourceExchangeDate,
      exchangeRate: officialExchangeRate.exchangeRate,
      source: "ECB",
    },
  });

  if (upsertResult.error) {
    throw new Error(
      upsertResult.error.message ??
        "No se ha podido guardar el tipo de cambio obtenido."
    );
  }

  return officialExchangeRate.exchangeRate;
}