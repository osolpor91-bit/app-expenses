"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  currencyOptions,
  getCurrencySymbol,
} from "@/lib/entityFields/commonOptions";

import {
  getSupplierConfirmationEmailAction,
  uploadSupplierInvoiceFromPortalAction,
} from "./actions";

type SupplierUploadLine = {
  id: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  vatRate: string;
  equivalenceSurchargeRate: string;
  withholdingRate: string;
};

type SupplierUploadFormLabels = {
  supplierTaxId: string;
  documentType: string;
  documentTypeInvoice: string;
  documentTypeCreditNote: string;
  invoiceNo: string;
  invoiceDate: string;
  linesTitle: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  vatRate: string;
  equivalenceSurchargeRate: string;
  withholdingRate: string;
  totalInvoice: string;
  currency: string;
  addLine: string;
  removeLine: string;
  file: string;
  confirmationEmail: string;
  confirmationEmailHelp: string;
  loadingConfirmationEmail: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successDescription: string;
  errorTitle: string;
};

type SupplierUploadFormProps = {
  uploadCode: string;
  labels: SupplierUploadFormLabels;
};

function createEmptyLine(): SupplierUploadLine {
  return {
    id: crypto.randomUUID(),
    quantity: "1",
    unitPrice: "",
    discountAmount: "0",
    vatRate: "",
    equivalenceSurchargeRate: "0",
    withholdingRate: "0",
  };
}

function parseNullableDecimalValue(value: string) {
  const normalizedValue = value.replace(/\./g, "").replace(",", ".").trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseDecimalValue(value: string) {
  return parseNullableDecimalValue(value) ?? 0;
}

function parseIntegerValue(value: string) {
  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue)) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function parsePercentageInputValue(value: string) {
  const parsedValue = parseNullableDecimalValue(value);

  if (parsedValue === null) {
    return null;
  }

  if (parsedValue < 0 || parsedValue > 100) {
    return null;
  }

  return parsedValue;
}

function validatePercentageInput({
  value,
  fieldLabel,
  lineNumber,
}: {
  value: string;
  fieldLabel: string;
  lineNumber: number;
}) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = parsePercentageInputValue(trimmedValue);

  if (parsedValue === null) {
    return `${fieldLabel} de la línea ${lineNumber} debe estar entre 0 y 100.`;
  }

  return null;
}

function validatePortalUploadLines(lines: SupplierUploadLine[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;

    const quantity = parseIntegerValue(line.quantity);

    if (quantity === null || quantity <= 0) {
      return `Qty. de la línea ${lineNumber} debe ser un número entero mayor que cero.`;
    }

    const unitPrice = parseNullableDecimalValue(line.unitPrice);

    if (line.unitPrice.trim() !== "" && unitPrice === null) {
      return `Precio de la línea ${lineNumber} debe ser un importe válido.`;
    }

    const discountAmount = parseNullableDecimalValue(line.discountAmount);

    if (
      line.discountAmount.trim() !== "" &&
      (discountAmount === null || discountAmount < 0)
    ) {
      return `Importe descuento de la línea ${lineNumber} debe ser un importe válido.`;
    }

    const vatError = validatePercentageInput({
      value: line.vatRate,
      fieldLabel: "% IVA",
      lineNumber,
    });

    if (vatError) {
      return vatError;
    }

    const equivalenceSurchargeError = validatePercentageInput({
      value: line.equivalenceSurchargeRate,
      fieldLabel: "% recargo equivalencia",
      lineNumber,
    });

    if (equivalenceSurchargeError) {
      return equivalenceSurchargeError;
    }

    const withholdingError = validatePercentageInput({
      value: line.withholdingRate,
      fieldLabel: "% IRPF",
      lineNumber,
    });

    if (withholdingError) {
      return withholdingError;
    }
  }

  return null;
}

function calculateLineTotal(line: SupplierUploadLine) {
  const quantity = parseIntegerValue(line.quantity) ?? 1;
  const unitPrice = parseDecimalValue(line.unitPrice);
  const discountAmount = parseDecimalValue(line.discountAmount);
  const vatRate = parsePercentageInputValue(line.vatRate) ?? 0;
  const equivalenceSurchargeRate =
    parsePercentageInputValue(line.equivalenceSurchargeRate) ?? 0;
  const withholdingRate = parsePercentageInputValue(line.withholdingRate) ?? 0;

  const grossAmount = Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;
  const baseAmount = Math.max(
    Math.round((grossAmount - discountAmount + Number.EPSILON) * 100) / 100,
    0
  );

  const vatAmount =
    Math.round((baseAmount * vatRate + Number.EPSILON) * 100) / 10000;
  const equivalenceSurchargeAmount =
    Math.round((baseAmount * equivalenceSurchargeRate + Number.EPSILON) * 100) /
    10000;
  const withholdingAmount =
    Math.round((baseAmount * withholdingRate + Number.EPSILON) * 100) / 10000;

  return (
    Math.round(
      (baseAmount + vatAmount + equivalenceSurchargeAmount - withholdingAmount) *
      100
    ) / 100
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAmountWithCurrencySymbol(value: number, currencyCode: string) {
  return `${formatAmount(value)} ${getCurrencySymbol(currencyCode)}`;
}

function formatDecimalInputValue(value: string) {
  const parsedValue = parseNullableDecimalValue(value);

  if (parsedValue === null) {
    return value;
  }

  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsedValue);
}

function normalizeTaxIdInput(value: string) {
  return value.replace(/[\s.-]+/g, "").toUpperCase();
}

export default function SupplierUploadForm({
  uploadCode,
  labels,
}: SupplierUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isLookingUpEmail, startEmailLookupTransition] = useTransition();

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [supplierTaxId, setSupplierTaxId] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [currencyCode, setCurrencyCode] = useState("EUR");
  const [lines, setLines] = useState<SupplierUploadLine[]>(() => [
    createEmptyLine(),
  ]);

  const canRemoveLines = lines.length > 1;

  const hasAnyLineValue = useMemo(
    () =>
      lines.some(
        (line) =>
          line.unitPrice.trim() !== "" ||
          (line.discountAmount.trim() !== "" && line.discountAmount.trim() !== "0") ||
          line.vatRate.trim() !== "" ||
          (line.equivalenceSurchargeRate.trim() !== "" &&
            line.equivalenceSurchargeRate.trim() !== "0") ||
          (line.withholdingRate.trim() !== "" &&
            line.withholdingRate.trim() !== "0")
      ),
    [lines]
  );

  const invoiceTotal = useMemo(
    () => lines.reduce((total, line) => total + calculateLineTotal(line), 0),
    [lines]
  );

  useEffect(() => {
    const normalizedTaxId = normalizeTaxIdInput(supplierTaxId);

    if (!normalizedTaxId) {
      setConfirmationEmail("");
      setCurrencyCode("EUR");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startEmailLookupTransition(async () => {
        const result = await getSupplierConfirmationEmailAction({
          uploadCode,
          supplierTaxId: normalizedTaxId,
        });

        if (result.ok) {
          setConfirmationEmail(result.data.email);
          setCurrencyCode(result.data.currencyCode);
          return;
        }

        setConfirmationEmail("");
        setCurrencyCode("EUR");
      });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [supplierTaxId, uploadCode]);

  function updateLine({
    id,
    field,
    value,
  }: {
    id: string;
    field: keyof Omit<SupplierUploadLine, "id">;
    value: string;
  }) {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.id === id
          ? {
            ...line,
            [field]: value,
          }
          : line
      )
    );
  }

  function addLine() {
    setLines((currentLines) => [...currentLines, createEmptyLine()]);
  }

  function removeLine(id: string) {
    setLines((currentLines) => {
      if (currentLines.length <= 1) {
        return currentLines;
      }

      return currentLines.filter((line) => line.id !== id);
    });
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="space-y-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault();

        const nativeEvent = event.nativeEvent as SubmitEvent;
        const submitter = nativeEvent.submitter as HTMLButtonElement | null;

        if (submitter?.value !== "submitSupplierInvoice") {
          return;
        }

        setSuccessMessage("");
        setErrorMessage("");

        const lineValidationError = validatePortalUploadLines(lines);

        if (lineValidationError) {
          setErrorMessage(lineValidationError);
          return;
        }

        const formData = new FormData(event.currentTarget);
        formData.set("uploadCode", uploadCode);
        formData.set("confirmationEmail", confirmationEmail.trim());
        formData.set("currencyCode", currencyCode.trim().toUpperCase() || "EUR");

        startTransition(async () => {
          try {
            const result = await uploadSupplierInvoiceFromPortalAction(formData);

            if (!result.ok) {
              setErrorMessage(result.error);
              return;
            }

            formRef.current?.reset();
            setSupplierTaxId("");
            setConfirmationEmail("");
            setCurrencyCode("EUR");
            setLines([createEmptyLine()]);
            setSuccessMessage(labels.successDescription);
          } catch (error) {
            console.error(error);
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Se ha producido un error inesperado al enviar la factura."
            );
          }
        });
      }}
    >
      <div className="grid gap-2 md:grid-cols-[minmax(0,1.05fr)_7.5rem_minmax(0,1fr)_9.5rem]">
        <div>
          <label
            className="block text-xs font-semibold text-app-muted"
            htmlFor="supplierTaxId"
          >
            {labels.supplierTaxId}
          </label>
          <input
            id="supplierTaxId"
            name="supplierTaxId"
            required
            value={supplierTaxId}
            onChange={(event) => setSupplierTaxId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-app-border px-2 py-1.5 text-xs outline-none focus:border-app-accent"
          />
        </div>
        <div>
          <label
            className="block text-xs font-semibold text-app-muted"
            htmlFor="documentType"
          >
            {labels.documentType}
          </label>
          <select
            id="documentType"
            name="documentType"
            required
            defaultValue="invoice"
            className="mt-1 w-full rounded-lg border border-app-border px-2 py-1.5 text-xs outline-none focus:border-app-accent"
          >
            <option value="invoice">{labels.documentTypeInvoice}</option>
            <option value="credit_note">{labels.documentTypeCreditNote}</option>
          </select>
        </div>

        <div>
          <label
            className="block text-xs font-semibold text-app-muted"
            htmlFor="invoiceNo"
          >
            {labels.invoiceNo}
          </label>
          <input
            id="invoiceNo"
            name="invoiceNo"
            required
            className="mt-1 w-full rounded-lg border border-app-border px-2 py-1.5 text-xs outline-none focus:border-app-accent"
          />
        </div>

        <div>
          <label
            className="block text-xs font-semibold text-app-muted"
            htmlFor="invoiceDate"
          >
            {labels.invoiceDate}
          </label>
          <input
            id="invoiceDate"
            name="invoiceDate"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-app-border px-2 py-1.5 text-xs outline-none focus:border-app-accent"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{labels.linesTitle}</h2>

          <button
            type="button"
            onClick={addLine}
            className="rounded-md border border-app-border px-2.5 py-1 text-xs font-semibold hover:bg-app-soft"
          >
            {labels.addLine}
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-app-border">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="bg-app-soft">
                <th className="w-16 border-b border-app-border px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                  {labels.quantity}
                </th>

                <th className="w-28 border-b border-app-border px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                  {labels.unitPrice}
                </th>

                <th className="w-28 border-b border-app-border px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                  {labels.discountAmount}
                </th>

                <th className="w-20 border-b border-app-border px-1 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                  {labels.vatRate}
                </th>

                <th className="w-20 border-b border-app-border px-1 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                  {labels.equivalenceSurchargeRate}
                </th>

                <th className="w-20 border-b border-app-border px-1 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                  {labels.withholdingRate}
                </th>

                <th className="w-16 border-b border-app-border px-2 py-1.5" />
              </tr>
            </thead>

            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id}>
                  <td className="w-16 border-b border-app-border px-2 py-1">
                    <input
                      name="lineQuantity"
                      inputMode="numeric"
                      placeholder="1"
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine({
                          id: line.id,
                          field: "quantity",
                          value: event.target.value,
                        })
                      }
                      className="w-full rounded-md border border-app-border px-2 py-1 text-right text-xs outline-none focus:border-app-accent"
                    />
                  </td>

                  <td className="w-28 border-b border-app-border px-2 py-1">
                    <input
                      name="lineUnitPrice"
                      inputMode="decimal"
                      placeholder="0.000,00"
                      value={line.unitPrice}
                      onChange={(event) =>
                        updateLine({
                          id: line.id,
                          field: "unitPrice",
                          value: event.target.value,
                        })
                      }
                      onBlur={(event) =>
                        updateLine({
                          id: line.id,
                          field: "unitPrice",
                          value: formatDecimalInputValue(event.target.value),
                        })
                      }
                      className="w-full rounded-md border border-app-border px-2 py-1 text-right text-xs outline-none focus:border-app-accent"
                    />
                  </td>

                  <td className="w-28 border-b border-app-border px-2 py-1">
                    <input
                      name="lineDiscountAmount"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={line.discountAmount}
                      onChange={(event) =>
                        updateLine({
                          id: line.id,
                          field: "discountAmount",
                          value: event.target.value,
                        })
                      }
                      onBlur={(event) =>
                        updateLine({
                          id: line.id,
                          field: "discountAmount",
                          value: formatDecimalInputValue(event.target.value),
                        })
                      }
                      className="w-full rounded-md border border-app-border px-2 py-1 text-right text-xs outline-none focus:border-app-accent"
                    />
                  </td>

                  <td className="w-20 border-b border-app-border px-1 py-1">
                    <input
                      name="lineVatRate"
                      inputMode="decimal"
                      placeholder="21"
                      value={line.vatRate}
                      onChange={(event) =>
                        updateLine({
                          id: line.id,
                          field: "vatRate",
                          value: event.target.value,
                        })
                      }
                      className="w-full rounded-md border border-app-border px-2 py-1 text-right text-xs outline-none focus:border-app-accent"
                    />
                  </td>

                  <td className="w-20 border-b border-app-border px-1 py-1">
                    <input
                      name="lineEquivalenceSurchargeRate"
                      inputMode="decimal"
                      placeholder="0"
                      value={line.equivalenceSurchargeRate}
                      onChange={(event) =>
                        updateLine({
                          id: line.id,
                          field: "equivalenceSurchargeRate",
                          value: event.target.value,
                        })
                      }
                      className="w-full rounded-md border border-app-border px-2 py-1 text-right text-xs outline-none focus:border-app-accent"
                    />
                  </td>

                  <td className="w-20 border-b border-app-border px-1 py-1">
                    <input
                      name="lineWithholdingRate"
                      inputMode="decimal"
                      placeholder="0"
                      value={line.withholdingRate}
                      onChange={(event) =>
                        updateLine({
                          id: line.id,
                          field: "withholdingRate",
                          value: event.target.value,
                        })
                      }
                      className="w-full rounded-md border border-app-border px-2 py-1 text-right text-xs outline-none focus:border-app-accent"
                    />
                  </td>

                  <td className="border-b border-app-border px-2 py-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={!canRemoveLines}
                      className="rounded-md border border-app-border px-2 py-0.5 text-[11px] font-semibold text-app-muted hover:bg-app-soft disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`${labels.removeLine} ${index + 1}`}
                    >
                      {labels.removeLine}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!hasAnyLineValue ? (
          <p className="mt-1.5 text-xs text-app-muted">
            Informa al menos una línea con precio e IVA.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="w-full max-w-xs rounded-lg border border-app-border bg-app-soft px-3 py-2 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
              {labels.totalInvoice}
            </p>
            <p className="mt-0.5 text-base font-bold text-primary-app">
              {formatAmountWithCurrencySymbol(invoiceTotal, currencyCode)}
            </p>
          </div>

          <div className="w-24">
            <label
              className="block text-[10px] font-semibold uppercase tracking-wide text-app-muted"
              htmlFor="currencyCode"
            >
              {labels.currency}
            </label>

            <select
              id="currencyCode"
              name="currencyCode"
              value={currencyCode}
              onChange={(event) => setCurrencyCode(event.target.value)}
              className="mt-1 w-full rounded-lg border border-app-border px-2 py-1.5 text-xs font-semibold outline-none focus:border-app-accent"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label
          className="block text-xs font-semibold text-app-muted"
          htmlFor="file"
        >
          {labels.file}
        </label>

        <div className="mt-1 rounded-lg border border-dashed border-app-border bg-app-soft px-3 py-3">
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,.xml,.jpg,.jpeg,.png,application/pdf,application/xml,text/xml,image/jpeg,image/png"
            className="block w-full cursor-pointer rounded-lg border border-app-border bg-white px-2 py-1.5 text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-app-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90"
          />

          <p className="mt-1.5 text-[11px] text-app-muted">
            Selecciona un archivo PDF, XML, JPG o PNG. Tamaño máximo: 10 MB.
          </p>
        </div>
      </div>

      <div className="max-w-sm">
        <label
          className="block text-xs font-semibold text-app-muted"
          htmlFor="confirmationEmail"
        >
          {labels.confirmationEmail}
        </label>

        <input
          id="confirmationEmail"
          name="confirmationEmail"
          type="email"
          value={confirmationEmail}
          onChange={(event) => setConfirmationEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-app-border px-2.5 py-1.5 text-sm outline-none focus:border-app-accent"
        />

        <p className="mt-1 text-[11px] text-app-muted">
          {isLookingUpEmail
            ? labels.loadingConfirmationEmail
            : labels.confirmationEmailHelp}
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-semibold">{labels.errorTitle}</p>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <p className="font-semibold">{labels.successTitle}</p>
          <p>{successMessage}</p>
        </div>
      ) : null}

      <div className="pt-1">
        <button
          type="submit"
          name="submitSupplierInvoice"
          value="submitSupplierInvoice"
          disabled={isPending}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? labels.submitting : labels.submit}
        </button>
      </div>
    </form>
  );
}