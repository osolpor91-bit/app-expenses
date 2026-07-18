"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createBulkInventoryAdjustmentAction,
  type CreateBulkInventoryAdjustmentInput,
} from "../actions";
import type {
  ItemWarehouseInventoryMap,
  WarehouseOption,
} from "@/lib/warehouses/warehouseOptions";

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
  bulkInventoryAdjustmentTransferOut?: string;
  bulkInventoryAdjustmentTransferIn?: string;
  bulkInventoryAdjustmentOriginWarehouse?: string;
  bulkInventoryAdjustmentDestinationWarehouse?: string;
  bulkInventoryAdjustmentNoActiveItems?: string;
  bulkInventoryAdjustmentCreated?: string;
  bulkInventoryAdjustmentError?: string;
  bulkInventoryAdjustmentNoChanges?: string;
  comment?: string;
  commentPlaceholder?: string;
  warehouseRequired?: string;
  defaultWarehouseRequired?: string;
  accept?: string;
  adjusting?: string;
  close?: string;
};

type BulkInventoryAdjustmentModalProps = {
  items: BulkInventoryAdjustmentItem[];
  warehouseOptions: WarehouseOption[];
  defaultWarehouseId: string;
  warehouseInventoryByItemId: ItemWarehouseInventoryMap;
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

function getOriginQuantities({
  items,
  warehouseInventoryByItemId,
  originWarehouseId,
}: {
  items: BulkInventoryAdjustmentItem[];
  warehouseInventoryByItemId: ItemWarehouseInventoryMap;
  originWarehouseId: string;
}) {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      getQuantityInputValue(
        warehouseInventoryByItemId[item.id]?.[originWarehouseId] ?? 0
      ),
    ])
  );
}

function getEmptyQuantities(items: BulkInventoryAdjustmentItem[]) {
  return Object.fromEntries(items.map((item) => [item.id, ""]));
}

function getParsedQuantity(value: string) {
  const quantity = Number(value.replace(",", "."));

  return Number.isFinite(quantity) ? quantity : null;
}

export default function BulkInventoryAdjustmentModal({
  items,
  warehouseOptions,
  defaultWarehouseId,
  warehouseInventoryByItemId,
  labels,
  onClose,
}: BulkInventoryAdjustmentModalProps) {
  const router = useRouter();
  const [originWarehouseId, setOriginWarehouseId] = useState(defaultWarehouseId);
  const [destinationWarehouseId, setDestinationWarehouseId] =
    useState(defaultWarehouseId);
  const [comment, setComment] = useState("");
  const [actualQuantities, setActualQuantities] = useState<
    Record<string, string>
  >(() => getEmptyQuantities(items));
  const [sourceQuantities, setSourceQuantities] = useState<
    Record<string, string>
  >(() =>
    getOriginQuantities({
      items,
      warehouseInventoryByItemId,
      originWarehouseId: defaultWarehouseId,
    })
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    defaultWarehouseId
      ? null
      : getLabel(
          labels,
          "defaultWarehouseRequired",
          "No hay ningún almacén predeterminado. Marca uno en Configuraciones > Almacenes."
        )
  );

  const changedCount = useMemo(() => {
    return items.reduce((count, item) => {
      const calculatedQuantity = Number(
        warehouseInventoryByItemId[item.id]?.[originWarehouseId] ?? 0
      );
      const sourceQuantity = Number(
        String(sourceQuantities[item.id] ?? "").replace(",", ".")
      );
      const actualQuantityValue = String(actualQuantities[item.id] ?? "").trim();
      const actualQuantity = Number(
        actualQuantityValue.replace(",", ".")
      );

      if (!Number.isFinite(calculatedQuantity)) {
        return count;
      }

      if (originWarehouseId !== destinationWarehouseId) {
        return Number.isFinite(actualQuantity) && actualQuantity > 0.000001
          ? count + 1
          : count;
      }

      if (
        !actualQuantityValue ||
        !Number.isFinite(sourceQuantity) ||
        !Number.isFinite(actualQuantity)
      ) {
        return count;
      }

      return Math.abs(actualQuantity - calculatedQuantity) > 0.000001
        ? count + 1
        : count;
    }, 0);
  }, [
    actualQuantities,
    destinationWarehouseId,
    items,
    originWarehouseId,
    sourceQuantities,
    warehouseInventoryByItemId,
  ]);

  const isTransferMode =
    Boolean(originWarehouseId) &&
    Boolean(destinationWarehouseId) &&
    originWarehouseId !== destinationWarehouseId;

  function changeOriginWarehouse(nextWarehouseId: string) {
    const nextOriginQuantities = getOriginQuantities({
      items,
      warehouseInventoryByItemId,
      originWarehouseId: nextWarehouseId,
    });

    setOriginWarehouseId(nextWarehouseId);
    setActualQuantities(getEmptyQuantities(items));
    setSourceQuantities(nextOriginQuantities);
    setErrorMessage(null);
    setMessage(null);
  }

  function changeDestinationWarehouse(nextWarehouseId: string) {
    const willUseTransferMode =
      Boolean(originWarehouseId) &&
      Boolean(nextWarehouseId) &&
      originWarehouseId !== nextWarehouseId;

    setDestinationWarehouseId(nextWarehouseId);

    if (willUseTransferMode) {
      setActualQuantities(getEmptyQuantities(items));
      setSourceQuantities(
        getOriginQuantities({
          items,
          warehouseInventoryByItemId,
          originWarehouseId,
        })
      );
    } else if (isTransferMode) {
      const nextOriginQuantities = getOriginQuantities({
        items,
        warehouseInventoryByItemId,
        originWarehouseId,
      });

      setActualQuantities(getEmptyQuantities(items));
      setSourceQuantities(nextOriginQuantities);
    }

    setErrorMessage(null);
    setMessage(null);
  }

  function updateSourceQuantity(itemId: string, value: string) {
    setSourceQuantities((currentQuantities) => ({
      ...currentQuantities,
      [itemId]: value,
    }));
    setErrorMessage(null);
    setMessage(null);
  }

  function updateActualQuantity(itemId: string, value: string) {
    setActualQuantities((currentQuantities) => ({
      ...currentQuantities,
      [itemId]: value,
    }));

    if (isTransferMode) {
      const calculatedQuantity = Number(
        warehouseInventoryByItemId[itemId]?.[originWarehouseId] ?? 0
      );
      const actualQuantity = getParsedQuantity(value.trim());

      if (Number.isFinite(calculatedQuantity)) {
        setSourceQuantities((currentQuantities) => ({
          ...currentQuantities,
          [itemId]:
            actualQuantity === null
              ? getQuantityInputValue(calculatedQuantity)
              : getQuantityInputValue(actualQuantity),
        }));
      }
    }

    setErrorMessage(null);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!defaultWarehouseId) {
      setErrorMessage(
        getLabel(
          labels,
          "defaultWarehouseRequired",
          "No hay ningún almacén predeterminado. Marca uno en Configuraciones > Almacenes."
        )
      );
      return;
    }

    if (!originWarehouseId || !destinationWarehouseId) {
      setErrorMessage(
        getLabel(labels, "warehouseRequired", "El almacén es obligatorio.")
      );
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const payload: CreateBulkInventoryAdjustmentInput = {
      comment,
      originWarehouseId,
      destinationWarehouseId,
      lines: items.map((item) => ({
        itemId: item.id,
        sourceQuantity: sourceQuantities[item.id] ?? "",
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
      <div className="flex h-full w-full flex-col border-0 border-primary-app bg-white shadow-[8px_8px_0_rgba(63,79,36,0.28)] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl sm:border-4 sm:p-1">
        <div className="flex min-h-0 flex-1 flex-col bg-app p-2 sm:rounded-[1.25rem] sm:border sm:border-app-border sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-base font-black uppercase tracking-tight text-primary-app sm:text-lg">
              {getLabel(
                labels,
                "bulkInventoryAdjustmentTitle",
                "Ajustar inventario"
              )}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-app-border px-2.5 py-1 text-xs font-semibold text-primary-app transition hover:bg-app-soft"
            >
              {getLabel(labels, "close", "Cerrar")}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col gap-2"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-[11px] font-semibold text-app sm:text-xs">
                {getLabel(
                  labels,
                  "bulkInventoryAdjustmentOriginWarehouse",
                  "Almacén origen"
                )}
                <select
                  value={originWarehouseId}
                  onChange={(event) => changeOriginWarehouse(event.target.value)}
                  className="input-app mt-1 h-9 px-3 py-1.5 text-sm"
                  required
                >
                  <option value="">-</option>
                  {warehouseOptions.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-[11px] font-semibold text-app sm:text-xs">
                {getLabel(
                  labels,
                  "bulkInventoryAdjustmentDestinationWarehouse",
                  "Almacén destino"
                )}
                <select
                  value={destinationWarehouseId}
                  onChange={(event) =>
                    changeDestinationWarehouse(event.target.value)
                  }
                  className="input-app mt-1 h-9 px-3 py-1.5 text-sm"
                  required
                >
                  <option value="">-</option>
                  {warehouseOptions.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-app-border bg-app">
              <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_1.8rem_3.25rem_2.2rem] items-center gap-0.5 border-b border-app-border bg-app-soft px-1.5 py-1 text-[8.5px] font-semibold uppercase text-app-muted sm:grid-cols-[7.25rem_minmax(6rem,8.75rem)_3.75rem_4.25rem_3.25rem] sm:gap-1 sm:px-2 sm:py-1.5 sm:text-[9px]">
                <span className="sm:hidden">Artículo</span>
                <span className="hidden sm:block">
                  {getLabel(labels, "code", "Código")}
                </span>
                <span className="hidden sm:block">
                  {getLabel(labels, "description", "Descripción")}
                </span>
                <span className="text-right sm:text-left">
                  <span className="sm:hidden">
                    {isTransferMode ? "Sal." : "Calc."}
                  </span>
                  <span className="hidden sm:inline">
                    {isTransferMode
                      ? getLabel(
                          labels,
                          "bulkInventoryAdjustmentTransferOut",
                          "Salida"
                        )
                      : getLabel(
                          labels,
                          "bulkInventoryAdjustmentCalculated",
                          "Calculado"
                        )}
                  </span>
                </span>
                <span className="text-right sm:text-left">
                  {isTransferMode
                    ? getLabel(
                        labels,
                        "bulkInventoryAdjustmentTransferIn",
                        "Entrada"
                      )
                    : getLabel(labels, "bulkInventoryAdjustmentReal", "Real")}
                </span>
                <span className="text-right sm:text-left">
                  {getLabel(labels, "unitOfMeasure", "Unidad")}
                </span>
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
                      warehouseInventoryByItemId[item.id]?.[
                        originWarehouseId
                      ] ?? 0
                    );
                    const unitOfMeasure = getStringValue(
                      item.base_unit_of_measure
                    );

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[minmax(0,1fr)_1.8rem_3.25rem_2.2rem] items-center gap-0.5 px-1.5 py-1 text-[10px] sm:grid-cols-[7.25rem_minmax(6rem,8.75rem)_3.75rem_4.25rem_3.25rem] sm:gap-1 sm:px-2 sm:py-1.5 sm:text-[11px]"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold leading-tight text-primary-app">
                            {itemCode}
                          </div>
                          <div
                            className="truncate text-[10px] leading-tight text-app-muted sm:hidden"
                            title={itemDescription}
                          >
                            {itemDescription}
                          </div>
                        </div>

                        <div className="hidden min-w-0 sm:block">
                          <div
                            className="truncate text-app"
                            title={itemDescription}
                          >
                            {itemDescription}
                          </div>
                        </div>

                        {isTransferMode ? (
                          <label className="block">
                            <span className="sr-only">
                              {getLabel(
                                labels,
                                "bulkInventoryAdjustmentTransferOut",
                                "Salida"
                              )}{" "}
                              {itemCode}
                            </span>
                            <input
                              value={sourceQuantities[item.id] ?? ""}
                              onChange={(event) =>
                                updateSourceQuantity(
                                  item.id,
                                  event.target.value
                                )
                              }
                              className="input-app h-6 px-1 py-0.5 text-right text-[11px] font-semibold sm:px-1.5 sm:text-left"
                              inputMode="decimal"
                            />
                          </label>
                        ) : (
                          <div className="text-right font-semibold text-app sm:text-left">
                            {calculatedQuantity}
                          </div>
                        )}

                        <label className="block">
                          <span className="sr-only">
                            {getLabel(
                              labels,
                              isTransferMode
                                ? "bulkInventoryAdjustmentTransferIn"
                                : "bulkInventoryAdjustmentReal",
                              isTransferMode ? "Entrada" : "Real"
                            )}{" "}
                            {itemCode}
                          </span>
                          <input
                            value={actualQuantities[item.id] ?? ""}
                            onChange={(event) =>
                              updateActualQuantity(item.id, event.target.value)
                            }
                            className="input-app h-6 px-1 py-0.5 text-right text-[11px] font-semibold sm:px-1.5 sm:text-left"
                            inputMode="decimal"
                          />
                        </label>

                        <div className="truncate text-right font-semibold text-app sm:text-left">
                          {unitOfMeasure}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="block text-[11px] font-semibold text-app sm:text-xs">
              {getLabel(labels, "comment", "Comentario")}
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="input-app mt-1 h-9 px-3 py-1.5 text-sm"
                placeholder={getLabel(
                  labels,
                  "commentPlaceholder",
                  "Comentario libre"
                )}
                required
              />
            </label>

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

            <div className="flex items-center justify-between gap-2">
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
                  className="btn-secondary-app px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  {getLabel(labels, "close", "Cerrar")}
                </button>

                <button
                  type="submit"
                  className="btn-primary-app px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    isSubmitting ||
                    items.length === 0 ||
                    !originWarehouseId ||
                    !destinationWarehouseId
                  }
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
