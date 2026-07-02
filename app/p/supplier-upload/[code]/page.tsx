import { notFound } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionaryByLocale } from "@/lib/i18n/dictionaries";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

import SupplierUploadForm from "./SupplierUploadForm";

type SupplierUploadPageProps = {
  params: Promise<{
    code: string;
  }>;
};

type SupplierUploadCompany = {
  id: string;
  tenant_id: string;
  name: string;
  supplier_portal_enabled: boolean;
  supplier_upload_code: string | null;
  supplier_portal_language: string | null;
};

export default async function SupplierUploadPage({
  params,
}: SupplierUploadPageProps) {
  const { code } = await params;

  const supabase = createSupabaseAdminClient();
  const supabaseAny = supabase as any;

  const { data: company, error } = (await supabaseAny
    .from("companies")
    .select(
      [
        "id",
        "tenant_id",
        "name",
        "supplier_portal_enabled",
        "supplier_upload_code",
        "supplier_portal_language",
      ].join(", ")
    )
    .eq("supplier_upload_code", code)
    .eq("supplier_portal_enabled", true)
    .maybeSingle()) as {
      data: SupplierUploadCompany | null;
      error: { message?: string } | null;
    };

  if (error || !company) {
    notFound();
  }

  const locale: Locale = isLocale(company.supplier_portal_language)
    ? company.supplier_portal_language
    : defaultLocale;

  const dict = getDictionaryByLocale(locale);

  return (
    <main className="min-h-screen bg-app-bg px-3 py-5 text-app-primary">
      <div className="mx-auto max-w-2xl rounded-xl border border-app-border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
            {dict.common.appName}
          </p>

          <h1 className="mt-1 text-xl font-semibold">
            {dict.supplierUpload.title}
          </h1>

          <p className="mt-3 rounded-lg bg-app-soft px-3 py-2 text-xs font-medium">
            {dict.supplierUpload.company}: {company.name}
          </p>
        </div>

        <SupplierUploadForm
          uploadCode={code}
          labels={{
            supplierTaxId: dict.supplierUpload.supplierTaxId,
            documentType: dict.common.documentType,
            documentTypeInvoice: dict.common.documentTypeInvoice,
            documentTypeCreditNote: dict.common.documentTypeCreditNote,
            invoiceNo: dict.supplierUpload.invoiceNo,
            invoiceDate: dict.supplierUpload.invoiceDate,
            linesTitle: dict.supplierUpload.linesTitle,
            quantity: dict.supplierUpload.quantity,
            unitPrice: dict.supplierUpload.unitPrice,
            discountAmount: dict.supplierUpload.discountAmount,
            vatRate: dict.supplierUpload.vatRate,
            equivalenceSurchargeRate:
              dict.supplierUpload.equivalenceSurchargeRate,
            withholdingRate: dict.supplierUpload.withholdingRate,
            totalInvoice: dict.supplierUpload.totalInvoice,
            currency: dict.common.currency,
            addLine: dict.supplierUpload.addLine,
            removeLine: dict.supplierUpload.removeLine,
            file: dict.supplierUpload.file,
            confirmationEmail: dict.supplierUpload.confirmationEmailField,
            confirmationEmailHelp: dict.supplierUpload.confirmationEmailHelp,
            loadingConfirmationEmail:
              dict.supplierUpload.loadingConfirmationEmail,
            submit: dict.supplierUpload.submit,
            submitting: dict.supplierUpload.submitting,
            successTitle: dict.supplierUpload.successTitle,
            successDescription: dict.supplierUpload.successDescription,
            errorTitle: dict.supplierUpload.errorTitle,
          }}
        />
      </div>
    </main>
  );
}