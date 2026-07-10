"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createBulkInventoryAdjustmentAction,
  type CreateBulkInventoryAdjustmentInput,
} from "../actions";

type BulkInventoryAdjustmentItem = {
  id: string;
  code?: unknown;
  description?: unknown;
  inventory?: unknown;
  base_unit_of_measure?: unknown;
};

type BulkInventoryAdjustmentModalLabels = Record<string, string | undefined> & {
  bulkInventoryAdjustmentTitle?: string;
  bulkInventoryAdjustmentAction?: string;
  bulkInventoryAdjustmentCalculated?: string;
  bulkInventoryAdjustmentReal?: string;
  bulkInventoryAdjustmentNoActiveItems?: string;
  bulkInventoryAdjustmentCreated?: string;
  bulkInventoryAdjustmentError?: string;
  bulkInventoryAdjustmentNoChanges?: string;
  comment?: string;
  commentPlaceholder?: string;
  accept?: string;
  adjusting?: string;
  close?: string;
};

type BulkInventoryAdjustmentModalProps = {
  items: BulkInventoryAdjustmentItem[];
  labels: BulkInventoryAdjustmentModalLabels;
  onClose: () => void;
};

function getLabel(
  labels: BulkInventoryAdjustmentModalLabels,
  key: string,
  fallback: string
) {
  return labels[key] ?? fallback;
}

function getStringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function getQuantityInputValue(value: unknown) {
  const quantity = Number(value ?? 0);

  return Number.isFinite(quantity) ? String(quantity) : "0";
}

export default function BulkInventoryAdjustmentModal({
  items,
  labels,
  onClose,
}: BulkInventoryAdjustmentModalProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [actualQuantities, setActualQuantities] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      items.map((item) => [item.id, getQuantityInputValue(item.inventory)])
    )
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changedCount = useMemo(() => {
    return items.reduce((count, item) => {
      const calculatedQuantity = Number(item.inventory ?? 0);
      const actualQuantity = Number(
        String(actualQuantities[item.id] ?? "").replace(",", ".")
      );

      if (!Number.isFinite(calculatedQuantity) || !Number.isFinite(actualQuantity)) {
        return count;
      }

      return Math.abs(actualQuantity - calculatedQuantity) > 0.000001
        ? count + 1
        : count;
    }, 0);
  }, [actualQuantities, items]);

  function updateActualQuantity(itemId: string, value: string) {
    setActualQuantities((currentQuantities) => ({
      ...currentQuantities,
      [itemId]: value,
    }));
    setErrorMessage(null);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const payload: CreateBulkInventoryAdjustmentInput = {
      comment,
      lines: items.map((item) => ({
        itemId: item.id,
        actualQuantity: actualQuantities[item.id] ?? "",
      })),
    };

    const result = await createBulkInventoryAdjustmentAction(payload);

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(
        `${getLabel(
          labels,
          "bulkInventoryAdjustmentError",
          "Error al ajustar inventario"
        )}: ${result.error}`
      );
      return;
    }

    setMessage(
      getLabel(
        labels,
        "bulkInventoryAdjustmentCreated",
        "Inventario ajustado correctamente."
      )
    );
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-stretch justify-center bg-black/35 p-0 sm:items-center sm:px-4 sm:py-6">
      <div className="flex h-full w-full flex-col border-0 border-primary-app bg-white shadow-[8px_8px_0_rgba(63,79,36,0.28)] sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl sm:border-4 sm:p-1">
        <div className="flex min-h-0 flex-1 flex-col bg-app p-3 sm:rounded-[1.25rem] sm:border sm:border-app-border sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-lg font-black uppercase tracking-tight text-primary-app">
              {getLabel(
                labels,
                "bulkInventoryAdjustmentTitle",
                "Ajustar inventario"
              )}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-app-border px-3 py-1 text-xs font-semibold text-primary-app transition hover:bg-app-soft"
            >
              {getLabel(labels, "close", "Cerrar")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
            <label className="block text-xs font-semibold text-app">
              {getLabel(labels, "comment", "Comentario")}
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="input-app mt-1 min-h-20 px-3 py-2 text-sm"
                placeholder={getLabel(
                  labels,
                  "commentPlaceholder",
                  "Comentario libre"
                )}
                required
              />
            </label>

            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-app-border bg-app">
              <div className="sticky top-0 z-10 hidden grid-cols-[1fr_2fr_0.85fr_0.85fr_0.8fr] gap-2 border-b border-app-border bg-app-soft px-3 py-2 text-[11px] font-semibold uppercase text-app-muted sm:grid">
                <span>{getLabel(labels, "code", "Código")}</span>
                <span>{getLabel(labels, "description", "Descripción")}</span>
                <span>
                  {getLabel(
                    labels,
                    "bulkInventoryAdjustmentCalculated",
                    "Calculado"
                  )}
                </span>
                <span>
                  {getLabel(labels, "bulkInventoryAdjustmentReal", "Real")}
                </span>
                <span>{getLabel(labels, "unitOfMeasure", "Unidad")}</span>
              </div>

              {items.length === 0 ? (
                <div className="p-4 text-sm text-app-muted">
                  {getLabel(
                    labels,
                    "bulkInventoryAdjustmentNoActiveItems",
                    "No hay artículos activos para ajustar."
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {items.map((item) => {
                    const itemCode = getStringValue(item.code);
                    const itemDescription = getStringValue(item.description);
                    const calculatedQuantity = getQuantityInputValue(
                      item.inventory
                    );
                    const unitOfMeasure = getStringValue(
                      item.base_unit_of_measure
                    );

                    return (
                      <div
                        key={item.id}
                        className="grid gap-2 px-3 py-3 text-sm sm:grid-cols-[1fr_2fr_0.85fr_0.85fr_0.8fr] sm:items-center sm:py-2"
                      >
                        <div className="flex items-start justify-between gap-3 sm:block">
                          <div>
                            <div className="text-[10px] font-medium uppercase text-app-muted sm:hidden">
                              {getLabel(labels, "code", "Código")}
                            </div>
                            <div className="font-semibold text-primary-app">
                              {itemCode}
                            </div>
                          </div>

                          <div className="text-right sm:hidden">
                            <div className="text-[10px] font-medium uppercase text-app-muted">
                              {getLabel(labels, "unitOfMeasure", "Unidad")}
                            </div>
                            <div className="font-semibold text-app">
                              {unitOfMeasure}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-medium uppercase text-app-muted sm:hidden">
                            {getLabel(labels, "description", "Descripción")}
                          </div>
                          <div className="truncate text-app" title={itemDescription}>
                            {itemDescription}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-medium uppercase text-app-muted sm:hidden">
                            {getLabel(
                              labels,
                              "bulkInventoryAdjustmentCalculated",
                              "Calculado"
                            )}
                          </div>
                          <div className="font-semibold text-app">
                            {calculatedQuantity}
                          </div>
                        </div>

                        <label className="block">
                          <span className="text-[10px] font-medium uppercase text-app-muted sm:hidden">
                            {getLabel(
                              labels,
                              "bulkInventoryAdjustmentReal",
                              "Real"
                            )}
                          </span>
                          <input
                            value={actualQuantities[item.id] ?? ""}
                            onChange={(event) =>
                              updateActualQuantity(item.id, event.target.value)
                            }
                            className="input-app mt-1 h-10 px-3 py-2 text-base font-semibold sm:mt-0 sm:h-8 sm:text-sm"
                            inputMode="decimal"
                            required
                          />
                        </label>

                        <div className="hidden font-semibold text-app sm:block">
                          {unitOfMeasure}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                {message}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-app-muted">
                {changedCount > 0
                  ? `${changedCount} movimiento(s)`
                  : getLabel(
                      labels,
                      "bulkInventoryAdjustmentNoChanges",
                      "Sin diferencias"
                    )}
              </span>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary-app px-4 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  {getLabel(labels, "close", "Cerrar")}
                </button>

                <button
                  type="submit"
                  className="btn-primary-app px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting || items.length === 0}
                >
                  {isSubmitting
                    ? getLabel(labels, "adjusting", "Ajustando...")
                    : getLabel(labels, "accept", "Aceptar")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
