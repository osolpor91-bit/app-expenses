export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import {
  getFieldLabel,
  getFieldOptionLabel,
} from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import { formatFieldValueForDisplay } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";
import { emailSendLogFields } from "@/lib/emailSendLogs/emailSendLogFields";
import {
  listEmailSendLogs,
  type EmailSendLogRecord,
} from "@/lib/emailSendLogs/emailSendLogRepository";

import FilterBar from "../components/FilterBar";

type EmailSendLogsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getSection(
  source: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const value = source[key];

  return isRecord(value) ? value : {};
}

function getString(
  source: Record<string, unknown>,
  key: string,
  fallback: string
) {
  const value = source[key];

  return typeof value === "string" ? value : fallback;
}

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getFieldLabels(labels: Record<string, unknown>) {
  return emailSendLogFields.reduce<Record<string, string>>((result, field) => {
    result[field.labelKey] = getString(labels, field.labelKey, field.labelKey);

    for (const option of field.options ?? []) {
      result[option.labelKey] = getString(labels, option.labelKey, option.value);
    }

    return result;
  }, {});
}

function getCellValue({
  record,
  field,
  fieldLabels,
}: {
  record: EmailSendLogRecord;
  field: EntityFieldDefinition;
  fieldLabels: Record<string, string>;
}) {
  const value = record[field.dbName as keyof EmailSendLogRecord];

  if (field.type === "option") {
    return getFieldOptionLabel({
      field,
      value,
      fieldLabels,
    });
  }

  if (field.dbName === "sent_at") {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(String(value)));
  }

  return formatFieldValueForDisplay(field, value);
}

export default async function EmailSendLogsPage({
  searchParams,
}: EmailSendLogsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { dict } = await getDictionary();
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  const commonLabels = getSection(dict, "common");
  const emailSendLogLabels = getSection(dict, "emailSendLogs");
  const fieldLabels = getFieldLabels(emailSendLogLabels);

  const relatedType = getSearchParamValue(resolvedSearchParams, "relatedType");
  const relatedName = getSearchParamValue(resolvedSearchParams, "relatedName");
  const relatedRecordId = getSearchParamValue(
    resolvedSearchParams,
    "relatedRecordId"
  );

  const { data, error } = await listEmailSendLogs({
    supabase,
    context: {
      tenantId: tenant.id,
      companyId: activeCompany?.id ?? null,
    },
    filters: {
      relatedType,
      relatedName,
      relatedRecordId,
    },
  });

  if (error) {
    throw new Error(`Error leyendo logs de correo: ${error.message}`);
  }

  const records = (data ?? []) as EmailSendLogRecord[];

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-primary-app">
          {getString(emailSendLogLabels, "title", "Logs de correo")}
        </h1>

        <p className="mt-1 text-sm text-app-muted">
          {getString(
            emailSendLogLabels,
            "description",
            "Consulta los correos enviados correctamente desde la aplicación."
          )}
        </p>
      </header>

      <FilterBar
        primaryFields={[
          {
            type: "text",
            name: "relatedName",
            label: getString(
              emailSendLogLabels,
              "relatedName",
              "Nombre relacionado"
            ),
            placeholder: "email_configurations",
          },
        ]}
        secondaryFields={[
          {
            type: "select",
            name: "relatedType",
            label: getString(
              emailSendLogLabels,
              "relatedType",
              "Relacionado con"
            ),
            allLabel: getString(commonLabels, "all", "Todos"),
            options: [
              {
                value: "table",
                label: getString(
                  emailSendLogLabels,
                  "relatedTypeTable",
                  "Tabla"
                ),
              },
              {
                value: "report",
                label: getString(
                  emailSendLogLabels,
                  "relatedTypeReport",
                  "Report"
                ),
              },
            ],
          },
          {
            type: "text",
            name: "relatedRecordId",
            label: getString(
              emailSendLogLabels,
              "relatedRecordId",
              "Registro relacionado"
            ),
            placeholder: "uuid",
          },
        ]}
        initialValues={{
          relatedType,
          relatedName,
          relatedRecordId,
        }}
        labels={{
          apply: getString(commonLabels, "apply", "Aplicar"),
          clear: getString(commonLabels, "clear", "Limpiar"),
          filters: getString(commonLabels, "filters", "Filtros"),
          hideFilters: getString(commonLabels, "hideFilters", "Ocultar filtros"),
          invalidDateRange: getString(
            commonLabels,
            "invalidDateRange",
            "Formato de fecha no válido. Usa 01/01/2026..31/01/2026."
          ),
        }}
      />

      <div className="mt-6 overflow-x-auto rounded-xl border border-app">
        <table className="table-app min-w-[960px] text-xs sm:text-sm">
          <thead className="table-head-app">
            <tr>
              {emailSendLogFields.map((field) => (
                <th
                  key={field.key}
                  className="px-3 py-2 text-left font-semibold"
                >
                  {getFieldLabel(fieldLabels, field)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)] bg-app">
            {records.map((record) => (
              <tr key={record.id} className="table-row-app">
                {emailSendLogFields.map((field) => (
                  <td
                    key={field.key}
                    className={
                      field.dbName === "related_name"
                        ? "px-3 py-2 font-medium"
                        : "px-3 py-2 text-app-muted"
                    }
                  >
                    {getCellValue({
                      record,
                      field,
                      fieldLabels,
                    })}
                  </td>
                ))}
              </tr>
            ))}

            {records.length === 0 && (
              <tr>
                <td
                  className="px-3 py-4 text-app-muted"
                  colSpan={emailSendLogFields.length}
                >
                  {getString(
                    emailSendLogLabels,
                    "emptyList",
                    "No hay logs de correo."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}