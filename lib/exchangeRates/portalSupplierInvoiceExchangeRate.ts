import type {
    EntityScopeContext,
    EntityWritePayload,
    SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import { currencyOptions } from "@/lib/entityFields/commonOptions";
import { getExchangeRate } from "@/lib/exchangeRates/exchangeRateService";
import {
    entityOperationError,
    entityOperationOk,
    type EntityOperationResult,
} from "@/lib/services/entityService";

const allowedCurrencyCodes = new Set<string>(
    currencyOptions.map((option) => option.value)
);

type PortalSupplierInvoiceCurrencyRow = {
    id: string;
    tenant_id: string;
    company_id: string;
    invoice_date: string | null;
    currency_code: string | null;
};

type PortalSupplierInvoiceExchangeRatePayloadInput = {
    supabase: SupabaseServerClient;
    tenantId: string;
    invoiceDate: string | null | undefined;
    referenceCurrencyCode: string | null | undefined;
    exchangeCurrencyCode: string | null | undefined;
};

type PortalSupplierInvoiceCreateExchangeRatePayloadInput = {
    supabase: SupabaseServerClient;
    context: EntityScopeContext;
    activeCompanyCurrencyCode: string | null | undefined;
    values: Record<string, unknown>;
};

type PortalSupplierInvoiceInvoiceDateUpdateExtraPayloadInput = {
    supabase: SupabaseServerClient;
    context: EntityScopeContext;
    id: string;
    fieldName: string;
    value: unknown;
    activeCompanyCurrencyCode: string | null | undefined;
};

function normalizeCurrencyCode(value: string | null | undefined) {
    const normalizedValue = String(value ?? "").trim().toUpperCase();

    return allowedCurrencyCodes.has(normalizedValue) ? normalizedValue : "";
}

function isValidIsoDateValue(value: string | null | undefined) {
    if (!value) {
        return false;
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getOptionalString(value: unknown) {
    if (typeof value !== "string") {
        return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue === "" ? null : trimmedValue;
}

function castPortalSupplierInvoiceCurrencyRow(
    data: unknown
): PortalSupplierInvoiceCurrencyRow | null {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return null;
    }

    const row = data as Partial<PortalSupplierInvoiceCurrencyRow>;

    if (!row.id || !row.tenant_id || !row.company_id) {
        return null;
    }

    return row as PortalSupplierInvoiceCurrencyRow;
}

async function getPortalSupplierInvoiceCurrencyRow({
    supabase,
    context,
    id,
}: {
    supabase: SupabaseServerClient;
    context: EntityScopeContext;
    id: string;
}): Promise<EntityOperationResult<PortalSupplierInvoiceCurrencyRow>> {
    let query = (supabase as any)
        .from("purchases_header")
        .select("id, tenant_id, company_id, invoice_date, currency_code")
        .eq("id", id)
        .eq("tenant_id", context.tenantId);

    if (context.companyId) {
        query = query.eq("company_id", context.companyId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        return entityOperationError(error.message);
    }

    const row = castPortalSupplierInvoiceCurrencyRow(data);

    if (!row) {
        return entityOperationError("No se ha podido leer la factura.");
    }

    return entityOperationOk(row);
}

export async function getPortalSupplierInvoiceExchangeRatePayload({
    supabase,
    tenantId,
    invoiceDate,
    referenceCurrencyCode,
    exchangeCurrencyCode,
}: PortalSupplierInvoiceExchangeRatePayloadInput): Promise<
    EntityOperationResult<EntityWritePayload>
> {
    const normalizedInvoiceDate = getOptionalString(invoiceDate);
    const normalizedReferenceCurrencyCode =
        normalizeCurrencyCode(referenceCurrencyCode);
    const normalizedExchangeCurrencyCode =
        normalizeCurrencyCode(exchangeCurrencyCode);

    if (!normalizedInvoiceDate || !isValidIsoDateValue(normalizedInvoiceDate)) {
        return entityOperationOk({
            exchange_rate: null,
        });
    }

    if (!normalizedReferenceCurrencyCode) {
        return entityOperationError(
            "La empresa activa no tiene una divisa válida configurada."
        );
    }

    if (!normalizedExchangeCurrencyCode) {
        return entityOperationOk({
            exchange_rate: null,
        });
    }

    if (normalizedReferenceCurrencyCode === normalizedExchangeCurrencyCode) {
        return entityOperationOk({
            exchange_rate: null,
        });
    }

    try {
        const exchangeRate = await getExchangeRate({
            supabase,
            tenantId,
            date: normalizedInvoiceDate,
            referenceCurrencyCode: normalizedReferenceCurrencyCode,
            exchangeCurrencyCode: normalizedExchangeCurrencyCode,
        });

        return entityOperationOk({
            exchange_rate: exchangeRate,
        });
    } catch (error) {
        console.error("Exchange rate lookup failed", {
            tenantId,
            invoiceDate: normalizedInvoiceDate,
            referenceCurrencyCode: normalizedReferenceCurrencyCode,
            exchangeCurrencyCode: normalizedExchangeCurrencyCode,
            error,
        });

        return entityOperationOk({
            exchange_rate: null,
        });
    }
}

export async function getPortalSupplierInvoiceCreateExchangeRatePayload({
    supabase,
    context,
    activeCompanyCurrencyCode,
    values,
}: PortalSupplierInvoiceCreateExchangeRatePayloadInput): Promise<
    EntityOperationResult<EntityWritePayload>
> {
    return getPortalSupplierInvoiceExchangeRatePayload({
        supabase,
        tenantId: context.tenantId,
        invoiceDate: getOptionalString(values.invoice_date),
        referenceCurrencyCode: activeCompanyCurrencyCode,
        exchangeCurrencyCode: getOptionalString(values.currency_code),
    });
}

export async function getPortalSupplierInvoiceInvoiceDateUpdateExtraPayload({
    supabase,
    context,
    id,
    fieldName,
    value,
    activeCompanyCurrencyCode,
}: PortalSupplierInvoiceInvoiceDateUpdateExtraPayloadInput): Promise<
    EntityOperationResult<EntityWritePayload>
> {
    if (fieldName !== "invoice_date" && fieldName !== "currency_code") {
        return entityOperationOk({});
    }

    const currentInvoiceResult = await getPortalSupplierInvoiceCurrencyRow({
        supabase,
        context,
        id,
    });

    if (!currentInvoiceResult.ok) {
        return currentInvoiceResult;
    }

    const invoiceDate =
        fieldName === "invoice_date"
            ? getOptionalString(value)
            : currentInvoiceResult.data.invoice_date;

    const exchangeCurrencyCode =
        fieldName === "currency_code"
            ? getOptionalString(value)
            : currentInvoiceResult.data.currency_code;

    return getPortalSupplierInvoiceExchangeRatePayload({
        supabase,
        tenantId: context.tenantId,
        invoiceDate,
        referenceCurrencyCode: activeCompanyCurrencyCode,
        exchangeCurrencyCode,
    });
}