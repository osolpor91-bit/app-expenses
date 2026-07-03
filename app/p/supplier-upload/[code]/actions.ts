"use server";

import { randomUUID } from "crypto";

import { attachmentStorageBucket } from "@/lib/attachments/attachmentConfig";
import { buildPortalSupplierInvoiceConfirmationEmail } from "@/lib/email/portalSupplierInvoiceConfirmationEmail";
import { sendTransactionalEmail } from "@/lib/email/transactionalEmailService";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionaryByLocale } from "@/lib/i18n/dictionaries";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { currencyOptions } from "@/lib/entityFields/commonOptions";
import { getPortalSupplierInvoiceExchangeRatePayload } from "@/lib/exchangeRates/portalSupplierInvoiceExchangeRate";
import { calculatePortalSupplierInvoiceLineAmounts } from "@/lib/portalSupplierInvoices/portalSupplierInvoiceLineCalculations";

const allowedFileTypes = new Set([
  "application/pdf",
  "application/xml",
  "text/xml",
  "image/jpeg",
  "image/png",
]);

const maxFileSizeBytes = 10 * 1024 * 1024;

type SupplierUploadCompany = {
  id: string;
  tenant_id: string;
  name: string | null;
  currency_code: string | null;
  supplier_portal_enabled: boolean;
  attachment_storage_provider: string;
  supplier_portal_language: string | null;
};

type SupplierUploadSupplier = {
  id: string;
  tax_id: string | null;
  email: string | null;
  currency_code: string | null;
  portal_default_line_type: string | null;
  portal_default_line_source_id: string | null;
};

type CreatedPortalSupplierInvoice = {
  id: string;
};

type GenericSupabaseError = {
  message?: string;
};

type PortalUploadLine = {
  quantity: string;
  unit_price: string;
  discount_amount: string;
  vat_rate: string;
  equivalence_surcharge_rate: string;
  withholding_rate: string;
};

type PortalUploadLineTotals = {
  quantity: number;
  unit_price: string;
  discount_rate: string;
  discount_amount: string;
  base_amount: string;
  vat_rate: string;
  vat_amount: number;
  equivalence_surcharge_rate: string;
  equivalence_surcharge_amount: number;
  withholding_rate: string;
  withholding_amount: number;
  total_amount: number;
};

function getRequiredText(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalText(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
}

function normalizeTaxId(value: string) {
  return value.replace(/[\s.-]+/g, "").toUpperCase();
}

function normalizeTaxIdForComparison(value: string | null) {
  if (!value) {
    return "";
  }

  return value.replace(/[\s.-]+/g, "").toUpperCase();
}

function normalizeEmail(value: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

const allowedCurrencyCodes = new Set<string>(
  currencyOptions.map((option) => option.value)
);

const allowedDocumentTypes = new Set(["invoice", "credit_note"]);
const allowedPurchaseLineTypes = new Set(["item", "account"]);

function normalizeDocumentType(value: string | null) {
  const normalizedValue = String(value ?? "").trim();

  return allowedDocumentTypes.has(normalizedValue) ? normalizedValue : "";
}

function normalizePurchaseLineType(value: string | null) {
  const normalizedValue = String(value ?? "").trim();

  return allowedPurchaseLineTypes.has(normalizedValue)
    ? normalizedValue
    : "item";
}

function normalizeCurrencyCode(value: string | null) {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  return allowedCurrencyCodes.has(normalizedValue) ? normalizedValue : "EUR";
}

function getFirstEmail(value: string | null) {
  return normalizeEmail(value).split(";")[0]?.trim() ?? "";
}

function isValidEmail(value: string) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value.trim());
}

function normalizeDecimal(value: string | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.replace(/\./g, "").replace(",", ".").trim();

  if (normalizedValue === "") {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue.toFixed(2);
}

function normalizeInteger(value: string | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();

  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}

function normalizePercentage(value: string | null) {
  const normalizedValue = normalizeDecimal(value);

  if (normalizedValue === null) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (parsedValue < 0 || parsedValue > 100) {
    return null;
  }

  return normalizedValue;
}

function sanitizeFileName(fileName: string) {
  const cleanedFileName = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleanedFileName || "factura";
}

function getFileExtension(fileName: string) {
  const match = fileName.match(/\.[a-zA-Z0-9]+$/);

  return match?.[0]?.toLowerCase() ?? "";
}

function isValidDateValue(value: string | null) {
  if (!value) {
    return true;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function getAllTextValues(formData: FormData, fieldName: string) {
  return formData
    .getAll(fieldName)
    .map((value) => (typeof value === "string" ? value.trim() : ""));
}

function getOptionalPercentageOrDefaultZero({
  value,
  fieldLabel,
  lineNumber,
}: {
  value: string;
  fieldLabel: string;
  lineNumber: number;
}) {
  if (value.trim() === "") {
    return "0.00";
  }

  const normalizedPercentage = normalizePercentage(value);

  if (normalizedPercentage === null) {
    throw new Error(`${fieldLabel} ${lineNumber}`);
  }

  return normalizedPercentage;
}

function getPortalUploadLines(formData: FormData): PortalUploadLine[] {
  const quantities = getAllTextValues(formData, "lineQuantity");
  const unitPrices = getAllTextValues(formData, "lineUnitPrice");
  const discountAmounts = getAllTextValues(formData, "lineDiscountAmount");
  const vatRates = getAllTextValues(formData, "lineVatRate");
  const equivalenceSurchargeRates = getAllTextValues(
    formData,
    "lineEquivalenceSurchargeRate"
  );
  const withholdingRates = getAllTextValues(formData, "lineWithholdingRate");

  const maxLength = Math.max(
    quantities.length,
    unitPrices.length,
    discountAmounts.length,
    vatRates.length,
    equivalenceSurchargeRates.length,
    withholdingRates.length
  );

  const lines: PortalUploadLine[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const lineNumber = index + 1;

    const rawQuantity = quantities[index] ?? "1";
    const rawUnitPrice = unitPrices[index] ?? "";
    const rawDiscountAmount = discountAmounts[index] ?? "0";
    const rawVatRate = vatRates[index] ?? "";
    const rawEquivalenceSurchargeRate =
      equivalenceSurchargeRates[index] ?? "0";
    const rawWithholdingRate = withholdingRates[index] ?? "0";

    const hasAnyValue =
      rawUnitPrice !== "" ||
      (rawDiscountAmount !== "" && rawDiscountAmount !== "0") ||
      rawVatRate !== "" ||
      (rawEquivalenceSurchargeRate !== "" &&
        rawEquivalenceSurchargeRate !== "0") ||
      (rawWithholdingRate !== "" && rawWithholdingRate !== "0");

    if (!hasAnyValue) {
      continue;
    }

    const quantity = normalizeInteger(rawQuantity);
    const unitPrice = normalizeDecimal(rawUnitPrice);
    const discountAmount = normalizeDecimal(rawDiscountAmount) ?? "0.00";
    const vatRate = normalizePercentage(rawVatRate);

    if (quantity === null) {
      throw new Error(`quantity:${lineNumber}`);
    }

    if (unitPrice === null) {
      throw new Error(`unitPrice:${lineNumber}`);
    }

    if (Number(discountAmount) < 0) {
      throw new Error(`discountAmount:${lineNumber}`);
    }

    if (vatRate === null) {
      throw new Error(`vatRate:${lineNumber}`);
    }

    const equivalenceSurchargeRate = getOptionalPercentageOrDefaultZero({
      value: rawEquivalenceSurchargeRate,
      fieldLabel: "equivalenceSurchargeRate",
      lineNumber,
    });

    const withholdingRate = getOptionalPercentageOrDefaultZero({
      value: rawWithholdingRate,
      fieldLabel: "withholdingRate",
      lineNumber,
    });

    lines.push({
      quantity,
      unit_price: unitPrice,
      discount_amount: discountAmount,
      vat_rate: vatRate,
      equivalence_surcharge_rate: equivalenceSurchargeRate,
      withholding_rate: withholdingRate,
    });
  }

  return lines;
}

function formatDatabaseAmount(value: number | null | undefined) {
  return (value ?? 0).toFixed(2);
}

function getLineTotals(line: PortalUploadLine): PortalUploadLineTotals {
  const calculationResult = calculatePortalSupplierInvoiceLineAmounts({
    values: {
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_amount: line.discount_amount,
      vat_rate: line.vat_rate,
      equivalence_surcharge_rate: line.equivalence_surcharge_rate,
      withholding_rate: line.withholding_rate,
    },
    changedFieldName: "discount_amount",
  });

  if (!calculationResult.ok) {
    throw new Error(calculationResult.error);
  }

  const payload = calculationResult.payload;

  return {
    quantity: Number(payload.quantity ?? 1),
    unit_price: formatDatabaseAmount(payload.unit_price),
    discount_rate: formatDatabaseAmount(payload.discount_rate),
    discount_amount: formatDatabaseAmount(payload.discount_amount),
    base_amount: formatDatabaseAmount(payload.base_amount),
    vat_rate: line.vat_rate,
    vat_amount: Number(payload.vat_amount ?? 0),
    equivalence_surcharge_rate: line.equivalence_surcharge_rate,
    equivalence_surcharge_amount: Number(
      payload.equivalence_surcharge_amount ?? 0
    ),
    withholding_rate: line.withholding_rate,
    withholding_amount: Number(payload.withholding_amount ?? 0),
    total_amount: Number(payload.total_amount ?? 0),
  };
}

function getPortalLocale(company: SupplierUploadCompany): Locale {
  return isLocale(company.supplier_portal_language)
    ? company.supplier_portal_language
    : defaultLocale;
}

function getPortalDict(company: SupplierUploadCompany) {
  return getDictionaryByLocale(getPortalLocale(company));
}

function getLineValidationErrorMessage({
  error,
  dict,
}: {
  error: unknown;
  dict: ReturnType<typeof getDictionaryByLocale>;
}) {
  if (!(error instanceof Error)) {
    return dict.supplierUpload.errors.invalidLines;
  }

  const [code, lineNumber] = error.message.split(":");

  if (code === "baseAmount") {
    return dict.supplierUpload.errors.invalidBaseAmount.replace(
      "{lineNumber}",
      lineNumber ?? ""
    );
  }

  if (code === "vatRate") {
    return dict.supplierUpload.errors.invalidVatRate.replace(
      "{lineNumber}",
      lineNumber ?? ""
    );
  }

  if (code === "equivalenceSurchargeRate") {
    return dict.supplierUpload.errors.invalidEquivalenceSurchargeRate.replace(
      "{lineNumber}",
      lineNumber ?? ""
    );
  }

  if (code === "withholdingRate") {
    return dict.supplierUpload.errors.invalidWithholdingRate.replace(
      "{lineNumber}",
      lineNumber ?? ""
    );
  }

  return dict.supplierUpload.errors.invalidLines;
}

async function getUploadCompany({
  supabaseAny,
  uploadCode,
}: {
  supabaseAny: any;
  uploadCode: string;
}) {
  return (await supabaseAny
    .from("companies")
    .select(
      [
        "id",
        "tenant_id",
        "name",
        "currency_code",
        "supplier_portal_enabled",
        "attachment_storage_provider",
        "supplier_portal_language",
      ].join(", ")
    )
    .eq("supplier_upload_code", uploadCode)
    .eq("supplier_portal_enabled", true)
    .maybeSingle()) as {
      data: SupplierUploadCompany | null;
      error: GenericSupabaseError | null;
    };
}

async function getSuppliersForCompany({
  supabaseAny,
  company,
}: {
  supabaseAny: any;
  company: SupplierUploadCompany;
}) {
  return (await supabaseAny
    .from("suppliers")
    .select(
      [
        "id",
        "tax_id",
        "email",
        "currency_code",
        "portal_default_line_type",
        "portal_default_line_source_id",
      ].join(", ")
    )
    .eq("tenant_id", company.tenant_id)
    .eq("company_id", company.id)
    .limit(1000)) as {
      data: SupplierUploadSupplier[] | null;
      error: GenericSupabaseError | null;
    };
}

function findSupplierByTaxId({
  suppliers,
  supplierTaxId,
}: {
  suppliers: SupplierUploadSupplier[] | null;
  supplierTaxId: string;
}) {
  return suppliers?.find(
    (candidateSupplier) =>
      normalizeTaxIdForComparison(candidateSupplier.tax_id) ===
      normalizeTaxIdForComparison(supplierTaxId)
  );
}

async function cleanupCreatedInvoice({
  supabase,
  supabaseAny,
  company,
  invoiceId,
  storagePath,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  supabaseAny: any;
  company: SupplierUploadCompany;
  invoiceId: string;
  storagePath?: string | null;
}) {
  if (storagePath) {
    await supabaseAny
      .from("entity_attachments")
      .delete()
      .eq("tenant_id", company.tenant_id)
      .eq("company_id", company.id)
      .eq("entity_table", "purchases_header")
      .eq("record_id", invoiceId);

    await supabase.storage.from(attachmentStorageBucket).remove([storagePath]);
  }

  await supabaseAny
    .from("purchases_line")
    .delete()
    .eq("tenant_id", company.tenant_id)
    .eq("company_id", company.id)
    .eq("purchase_header_id", invoiceId);

  await supabaseAny
    .from("purchases_header")
    .delete()
    .eq("id", invoiceId)
    .eq("tenant_id", company.tenant_id)
    .eq("company_id", company.id);
}

export async function getSupplierConfirmationEmailAction({
  uploadCode,
  supplierTaxId,
}: {
  uploadCode: string;
  supplierTaxId: string;
}): Promise<EntityOperationResult<{ email: string; currencyCode: string }>> {
  const normalizedUploadCode = uploadCode.trim();
  const normalizedSupplierTaxId = normalizeTaxId(supplierTaxId);

  if (!normalizedUploadCode || !normalizedSupplierTaxId) {
    return entityOperationOk({
      email: "",
      currencyCode: "EUR",
    });
  }

  const supabase = createSupabaseAdminClient();
  const supabaseAny = supabase as any;

  const { data: company, error: companyError } = await getUploadCompany({
    supabaseAny,
    uploadCode: normalizedUploadCode,
  });

  if (companyError || !company) {
    return entityOperationError("El enlace de subida no está disponible.");
  }

  const dict = getPortalDict(company);

  const { data: suppliers, error: supplierError } = await getSuppliersForCompany({
    supabaseAny,
    company,
  });

  if (supplierError) {
    return entityOperationError(dict.supplierUpload.errors.supplierValidation);
  }

  const supplier = findSupplierByTaxId({
    suppliers,
    supplierTaxId: normalizedSupplierTaxId,
  });

  if (!supplier) {
    return entityOperationError(dict.supplierUpload.errors.supplierNotFound);
  }

  return entityOperationOk({
    email: getFirstEmail(supplier.email),
    currencyCode: normalizeCurrencyCode(supplier.currency_code),
  });
}

async function runWithTimeout<T>({
  promise,
  timeoutMs,
  timeoutMessage,
}: {
  promise: Promise<T>;
  timeoutMs: number;
  timeoutMessage: string;
}): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function uploadSupplierInvoiceFromPortalAction(
  formData: FormData
): Promise<EntityOperationResult<{ id: string }>> {
  const uploadCode = getRequiredText(formData, "uploadCode");

  if (!uploadCode) {
    return entityOperationError("El enlace de subida no es válido.");
  }

  const supabase = createSupabaseAdminClient();
  const supabaseAny = supabase as any;

  const { data: company, error: companyError } = await getUploadCompany({
    supabaseAny,
    uploadCode,
  });

  if (companyError || !company) {
    return entityOperationError("El enlace de subida no está disponible.");
  }

  const dict = getPortalDict(company);

  const supplierTaxId = normalizeTaxId(getRequiredText(formData, "supplierTaxId"));
  const documentType = normalizeDocumentType(getRequiredText(formData, "documentType"));
  const invoiceNo = getRequiredText(formData, "invoiceNo");
  const invoiceDate = getRequiredText(formData, "invoiceDate");

  const confirmationEmail = normalizeEmail(
    getOptionalText(formData, "confirmationEmail")
  );

  const currencyCode = normalizeCurrencyCode(
    getOptionalText(formData, "currencyCode")
  );

  const file = formData.get("file");

  let lines: PortalUploadLine[];

  try {
    lines = getPortalUploadLines(formData);
  } catch (error) {
    return entityOperationError(
      getLineValidationErrorMessage({
        error,
        dict,
      })
    );
  }

  if (!supplierTaxId) {
    return entityOperationError(dict.supplierUpload.errors.supplierTaxIdRequired);
  }

  if (!documentType) {
    return entityOperationError(dict.supplierUpload.errors.invalidDocumentType);
  }

  if (!invoiceNo) {
    return entityOperationError(dict.supplierUpload.errors.invoiceNoRequired);
  }

  if (!invoiceDate) {
    return entityOperationError(dict.supplierUpload.errors.invoiceDateRequired);
  }

  if (!isValidDateValue(invoiceDate)) {
    return entityOperationError(dict.supplierUpload.errors.invalidInvoiceDate);
  }

  if (!confirmationEmail) {
    return entityOperationError("Email is missing.");
  }

  if (!isValidEmail(confirmationEmail)) {
    return entityOperationError(
      dict.supplierUpload.errors.invalidConfirmationEmail
    );
  }

  if (lines.length === 0) {
    return entityOperationError(dict.supplierUpload.errors.linesRequired);
  }

  if (!(file instanceof File)) {
    return entityOperationError(dict.supplierUpload.errors.fileRequired);
  }

  if (file.size <= 0) {
    return entityOperationError(dict.supplierUpload.errors.emptyFile);
  }

  if (file.size > maxFileSizeBytes) {
    return entityOperationError(dict.supplierUpload.errors.maxFileSize);
  }

  if (!allowedFileTypes.has(file.type)) {
    return entityOperationError(dict.supplierUpload.errors.invalidFileType);
  }

  if (company.attachment_storage_provider !== "supabase_storage") {
    return entityOperationError(dict.supplierUpload.errors.unsupportedStorage);
  }

  const { data: suppliers, error: supplierError } = await getSuppliersForCompany({
    supabaseAny,
    company,
  });

  if (supplierError) {
    return entityOperationError(dict.supplierUpload.errors.supplierValidation);
  }

  const supplier = findSupplierByTaxId({
    suppliers,
    supplierTaxId,
  });

  if (!supplier) {
    return entityOperationError(dict.supplierUpload.errors.supplierNotFound);
  }

  const exchangeRatePayloadResult =
    await getPortalSupplierInvoiceExchangeRatePayload({
      supabase: supabase as any,
      tenantId: company.tenant_id,
      invoiceDate,
      referenceCurrencyCode: company.currency_code,
      exchangeCurrencyCode: currencyCode,
    });

  if (!exchangeRatePayloadResult.ok) {
    return entityOperationError(exchangeRatePayloadResult.error);
  }

  const now = new Date().toISOString();

  const { data: invoice, error: invoiceError } = (await supabaseAny
    .from("purchases_header")
    .insert({
      tenant_id: company.tenant_id,
      company_id: company.id,
      supplier_id: supplier.id,
      document_type: documentType,
      currency_code: currencyCode,
      exchange_rate: exchangeRatePayloadResult.data.exchange_rate,
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      posting_date: getTodayDateValue(),
      source_type: "portal",
      source_received_at: now,
      status: "Pendiente revisión",
    })
    .select("id")
    .single()) as {
      data: CreatedPortalSupplierInvoice | null;
      error: GenericSupabaseError | null;
    };

  if (invoiceError || !invoice) {
    return entityOperationError(
      invoiceError?.message ?? dict.supplierUpload.errors.invoiceCreateError
    );
  }

  let lineTotals: PortalUploadLineTotals[];

  try {
    lineTotals = lines.map(getLineTotals);
  } catch (error) {
    await cleanupCreatedInvoice({
      supabase,
      supabaseAny,
      company,
      invoiceId: invoice.id,
    });

    return entityOperationError(
      error instanceof Error ? error.message : dict.supplierUpload.errors.invalidLines
    );
  }

  const linePayload = lineTotals.map((line) => ({
    tenant_id: company.tenant_id,
    company_id: company.id,
    purchase_header_id: invoice.id,
    line_type: normalizePurchaseLineType(supplier.portal_default_line_type),
    line_source_id: supplier.portal_default_line_source_id || null,

    quantity: line.quantity,
    unit_price: line.unit_price,
    discount_rate: line.discount_rate,
    discount_amount: line.discount_amount,
    base_amount: line.base_amount,

    vat_rate: line.vat_rate,
    equivalence_surcharge_rate: line.equivalence_surcharge_rate,
    withholding_rate: line.withholding_rate,
  }));

  const { error: lineInsertError } = (await supabaseAny
    .from("purchases_line")
    .insert(linePayload)) as {
      error: GenericSupabaseError | null;
    };

  if (lineInsertError) {
    await cleanupCreatedInvoice({
      supabase,
      supabaseAny,
      company,
      invoiceId: invoice.id,
    });

    return entityOperationError(
      lineInsertError.message ?? dict.supplierUpload.errors.linesCreateError
    );
  }

  const safeFileName = sanitizeFileName(file.name);
  const fileExtension = getFileExtension(safeFileName);
  const storageFileName = `${randomUUID()}${fileExtension || ""}`;
  const storagePath = [
    company.tenant_id,
    company.id,
    "purchases_header",
    invoice.id,
    storageFileName,
  ].join("/");

  const { error: uploadError } = await supabase.storage
    .from(attachmentStorageBucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    await cleanupCreatedInvoice({
      supabase,
      supabaseAny,
      company,
      invoiceId: invoice.id,
    });

    return entityOperationError(
      uploadError.message ?? dict.supplierUpload.errors.fileUploadError
    );
  }

  const { error: fileRecordError } = (await supabaseAny
    .from("entity_attachments")
    .insert({
      tenant_id: company.tenant_id,
      company_id: company.id,
      entity_table: "purchases_header",
      record_id: invoice.id,
      created_by_upload_code: uploadCode,
      storage_provider: "supabase_storage",
      storage_bucket: attachmentStorageBucket,
      file_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    })) as {
      error: GenericSupabaseError | null;
    };

  if (fileRecordError) {
    await cleanupCreatedInvoice({
      supabase,
      supabaseAny,
      company,
      invoiceId: invoice.id,
      storagePath,
    });

    return entityOperationError(
      fileRecordError.message ?? dict.supplierUpload.errors.fileRecordError
    );
  }

  const totalAmount = lineTotals.reduce(
    (currentTotal, line) => currentTotal + line.total_amount,
    0
  );

  if (confirmationEmail) {
    const emailContent = buildPortalSupplierInvoiceConfirmationEmail({
      company,
      supplierTaxId,
      invoiceNo,
      invoiceDate,
      lines: lineTotals,
      totalAmount,
      currencyCode,
      labels: dict.supplierUpload.confirmationEmail,
    });

    try {
      const sendResult = await runWithTimeout({
        timeoutMs: 10000,
        timeoutMessage:
          "Tiempo de espera agotado enviando el correo de confirmación.",
        promise: sendTransactionalEmail({
          supabase,
          context: {
            tenantId: company.tenant_id,
            companyId: company.id,
          },
          input: {
            applicationArea: "purchasing",
            to: confirmationEmail,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
            relatedTarget: {
              relatedType: "table",
              relatedName: "purchases_header",
              relatedRecordId: invoice.id,
            },
          },
        }),
      });

      if (!sendResult.ok) {
        console.error(
          "No se pudo enviar el correo de confirmación del portal de proveedores:",
          sendResult.error
        );
      }
    } catch (error) {
      console.error(
        "No se pudo enviar el correo de confirmación del portal de proveedores:",
        error
      );
    }
  }

  return entityOperationOk({
    id: invoice.id,
  });
}
