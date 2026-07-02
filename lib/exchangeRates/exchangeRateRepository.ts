import type { SupabaseServerClient } from "@/lib/entities/core/entityRepository";

export type ExchangeRateLookup = {
  tenantId: string;
  referenceCurrencyCode: string;
  exchangeCurrencyCode: string;
  exchangeDate: string;
  source?: string;
};

export type ExchangeRateInsert = ExchangeRateLookup & {
  sourceExchangeDate: string;
  exchangeRate: number;
};

type ExchangeRateRow = {
  id: string;
  tenant_id: string;
  reference_currency_code: string;
  exchange_currency_code: string;
  exchange_date: string;
  source_exchange_date: string;
  exchange_rate: number | string;
  source: string;
};

function getSupabaseAny(supabase: SupabaseServerClient) {
  return supabase as any;
}

function castExchangeRateRow(data: unknown): ExchangeRateRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const row = data as Partial<ExchangeRateRow>;

  if (!row.id || !row.tenant_id || !row.exchange_rate) {
    return null;
  }

  return row as ExchangeRateRow;
}

export function getExchangeRateNumber(row: ExchangeRateRow) {
  const value = Number(row.exchange_rate);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

export async function findExchangeRate({
  supabase,
  lookup,
}: {
  supabase: SupabaseServerClient;
  lookup: ExchangeRateLookup;
}) {
  const source = lookup.source ?? "ECB";

  const { data, error } = await getSupabaseAny(supabase)
    .from("exchange_rates")
    .select(
      [
        "id",
        "tenant_id",
        "reference_currency_code",
        "exchange_currency_code",
        "exchange_date",
        "source_exchange_date",
        "exchange_rate",
        "source",
      ].join(", ")
    )
    .eq("tenant_id", lookup.tenantId)
    .eq("reference_currency_code", lookup.referenceCurrencyCode)
    .eq("exchange_currency_code", lookup.exchangeCurrencyCode)
    .eq("exchange_date", lookup.exchangeDate)
    .eq("source", source)
    .maybeSingle();

  return {
    data: castExchangeRateRow(data),
    error,
  };
}

export async function upsertExchangeRate({
  supabase,
  input,
}: {
  supabase: SupabaseServerClient;
  input: ExchangeRateInsert;
}) {
  const now = new Date().toISOString();
  const source = input.source ?? "ECB";

  const { data, error } = await getSupabaseAny(supabase)
    .from("exchange_rates")
    .upsert(
      {
        tenant_id: input.tenantId,
        reference_currency_code: input.referenceCurrencyCode,
        exchange_currency_code: input.exchangeCurrencyCode,
        exchange_date: input.exchangeDate,
        source_exchange_date: input.sourceExchangeDate,
        exchange_rate: input.exchangeRate,
        source,
        updated_at: now,
      },
      {
        onConflict:
          "tenant_id,reference_currency_code,exchange_currency_code,exchange_date,source",
      }
    )
    .select(
      [
        "id",
        "tenant_id",
        "reference_currency_code",
        "exchange_currency_code",
        "exchange_date",
        "source_exchange_date",
        "exchange_rate",
        "source",
      ].join(", ")
    )
    .single();

  return {
    data: castExchangeRateRow(data),
    error,
  };
}