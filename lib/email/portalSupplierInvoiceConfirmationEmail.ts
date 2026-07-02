import { getCurrencySymbol } from "@/lib/entityFields/commonOptions";

type SupplierUploadCompanyForEmail = {
  name: string | null;
};

type PortalUploadLineForEmail = {
  base_amount: string | number | null;
  vat_rate: string | number | null;
  equivalence_surcharge_rate: string | number | null;
  withholding_rate: string | number | null;
  total_amount?: string | number | null;
};

export type PortalSupplierInvoiceConfirmationEmailLabels = {
  subject: string;
  title: string;
  intro: string;
  pendingReview: string;
  invoiceData: string;
  company: string;
  supplierTaxId: string;
  invoiceNo: string;
  invoiceDate: string;
  lineCount: string;
  baseTotal: string;
  invoiceTotal: string;
  footer: string;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAmountWithCurrencySymbol(
  value: number,
  currencyCode: string | null | undefined
) {
  return `${formatAmount(value)} ${getCurrencySymbol(currencyCode)}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function replaceTemplateTokens(
  template: string,
  values: Record<string, string>
) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}
function parseAmount(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return 0;
  }

  /*
   * Valores posibles:
   * - "880.00"   -> formato técnico BD/Postgres, punto decimal
   * - "880,00"   -> formato español, coma decimal
   * - "1.064,80" -> formato español con miles
   *
   * Si hay coma, asumimos formato español.
   * Si no hay coma, asumimos formato técnico con punto decimal.
   */
  const normalizedValue = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : rawValue;

  const numericValue = Number(normalizedValue);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function roundAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateLineTotalAmount(line: PortalUploadLineForEmail) {
  const baseAmount = parseAmount(line.base_amount);
  const vatRate = parseAmount(line.vat_rate);
  const equivalenceSurchargeRate = parseAmount(line.equivalence_surcharge_rate);
  const withholdingRate = parseAmount(line.withholding_rate);

  const vatAmount = roundAmount((baseAmount * vatRate) / 100);
  const equivalenceSurchargeAmount = roundAmount(
    (baseAmount * equivalenceSurchargeRate) / 100
  );
  const withholdingAmount = roundAmount((baseAmount * withholdingRate) / 100);

  return roundAmount(
    baseAmount + vatAmount + equivalenceSurchargeAmount - withholdingAmount
  );
}

function getTotals(lines: PortalUploadLineForEmail[]) {
  return lines.reduce(
    (totals, line) => {
      const baseAmount = parseAmount(line.base_amount);
      const totalAmount = calculateLineTotalAmount(line);

      return {
        baseAmount: roundAmount(totals.baseAmount + baseAmount),
        totalAmount: roundAmount(totals.totalAmount + totalAmount),
      };
    },
    {
      baseAmount: 0,
      totalAmount: 0,
    }
  );
}

function buildTextEmail({
  company,
  supplierTaxId,
  invoiceNo,
  invoiceDate,
  lines,
  totalAmount,
  currencyCode,
  labels,
}: {
  company: SupplierUploadCompanyForEmail;
  supplierTaxId: string;
  invoiceNo: string;
  invoiceDate: string | null;
  lines: PortalUploadLineForEmail[];
  totalAmount: number;
  currencyCode: string | null | undefined;
  labels: PortalSupplierInvoiceConfirmationEmailLabels;
}) {
  const totals = getTotals(lines);

  return [
    labels.title,
    "",
    labels.intro,
    labels.pendingReview,
    "",
    labels.invoiceData,
    "--------------------",
    `${labels.company}: ${company.name ?? "-"}`,
    `${labels.supplierTaxId}: ${supplierTaxId}`,
    `${labels.invoiceNo}: ${invoiceNo}`,
    `${labels.invoiceDate}: ${formatDate(invoiceDate)}`,
    `${labels.lineCount}: ${lines.length}`,
    `${labels.baseTotal}: ${formatAmountWithCurrencySymbol(
      totals.baseAmount,
      currencyCode
    )}`,
    `${labels.invoiceTotal}: ${formatAmountWithCurrencySymbol(
      totals.totalAmount,
      currencyCode
    )}`,
    "",
    labels.footer,
  ].join("\n");
}

function buildHtmlEmail({
  company,
  supplierTaxId,
  invoiceNo,
  invoiceDate,
  lines,
  totalAmount,
  currencyCode,
  labels,
}: {
  company: SupplierUploadCompanyForEmail;
  supplierTaxId: string;
  invoiceNo: string;
  invoiceDate: string | null;
  lines: PortalUploadLineForEmail[];
  totalAmount: number;
  currencyCode: string | null | undefined;
  labels: PortalSupplierInvoiceConfirmationEmailLabels;
}) {
  const totals = getTotals(lines);

  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;padding:0;background:#f6f7f4;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dfe4da;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:22px 24px;background:#244536;color:#ffffff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">
              Osolpor
            </div>
            <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.25;font-weight:700;">
              ${escapeHtml(labels.title)}
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 18px 0;font-size:15px;line-height:1.55;color:#334155;">
              ${escapeHtml(labels.intro)}
              <br />
              <strong>${escapeHtml(labels.pendingReview)}</strong>
            </p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
              <tr>
                <td colspan="2" style="padding:12px 14px;background:#f3f6f0;font-size:14px;font-weight:700;color:#244536;">
                  ${escapeHtml(labels.invoiceData)}
                </td>
              </tr>

              <tr>
                <td style="width:38%;padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b;">
                  ${escapeHtml(labels.company)}
                </td>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#0f172a;">
                  ${escapeHtml(company.name ?? "-")}
                </td>
              </tr>

              <tr>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b;">
                  ${escapeHtml(labels.supplierTaxId)}
                </td>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#0f172a;">
                  ${escapeHtml(supplierTaxId)}
                </td>
              </tr>

              <tr>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b;">
                  ${escapeHtml(labels.invoiceNo)}
                </td>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#0f172a;">
                  ${escapeHtml(invoiceNo)}
                </td>
              </tr>

              <tr>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b;">
                  ${escapeHtml(labels.invoiceDate)}
                </td>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#0f172a;">
                  ${escapeHtml(formatDate(invoiceDate))}
                </td>
              </tr>

              <tr>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b;">
                  ${escapeHtml(labels.lineCount)}
                </td>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#0f172a;">
                  ${lines.length}
                </td>
              </tr>

              <tr>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b;">
                  ${escapeHtml(labels.baseTotal)}
                </td>
                <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#0f172a;">
                  ${formatAmountWithCurrencySymbol(totals.baseAmount, currencyCode)}
                </td>
              </tr>
            </table>

            <div style="margin-top:18px;padding:16px 18px;background:#f3f6f0;border:1px solid #dfe8d7;border-radius:12px;">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">
                ${escapeHtml(labels.invoiceTotal)}
              </div>
              <div style="margin-top:4px;font-size:24px;line-height:1.2;font-weight:800;color:#244536;">
                ${formatAmountWithCurrencySymbol(totals.totalAmount, currencyCode)}
              </div>
            </div>

            <p style="margin:18px 0 0 0;font-size:13px;line-height:1.5;color:#64748b;">
              ${escapeHtml(labels.footer)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`.trim();
}

export function buildPortalSupplierInvoiceConfirmationEmail({
  company,
  supplierTaxId,
  invoiceNo,
  invoiceDate,
  lines,
  totalAmount,
  currencyCode,
  labels,
}: {
  company: SupplierUploadCompanyForEmail;
  supplierTaxId: string;
  invoiceNo: string;
  invoiceDate: string | null;
  lines: PortalUploadLineForEmail[];
  totalAmount: number;
  currencyCode: string | null | undefined;
  labels: PortalSupplierInvoiceConfirmationEmailLabels;
}) {
  const text = buildTextEmail({
    company,
    supplierTaxId,
    invoiceNo,
    invoiceDate,
    lines,
    totalAmount,
    currencyCode,
    labels,
  });

  const html = buildHtmlEmail({
    company,
    supplierTaxId,
    invoiceNo,
    invoiceDate,
    lines,
    totalAmount,
    currencyCode,
    labels,
  });

  return {
    subject: replaceTemplateTokens(labels.subject, {
      invoiceNo,
    }),
    text,
    html,
  };
}