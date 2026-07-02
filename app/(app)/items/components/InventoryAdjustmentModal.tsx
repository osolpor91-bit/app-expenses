"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
    createInventoryAdjustmentAction,
    type CreateInventoryAdjustmentInput,
} from "../actions";

type InventoryAdjustmentItem = {
    id: string;
    code?: unknown;
    description?: unknown;
    base_unit_of_measure?: unknown;
};

type InventoryAdjustmentModalLabels = Record<string, string | undefined> & {
    inventoryAdjustmentTitle?: string;
    inventoryAdjustmentSubtitle?: string;
    selectedItem?: string;
    selectedItemDescription?: string;
    postingDate?: string;
    adjustmentEntryType?: string;
    adjustmentEntryTypeIn?: string;
    adjustmentEntryTypeOut?: string;
    documentNo?: string;
    quantity?: string;
    unitOfMeasure?: string;
    unitUnd?: string;
    unitKg?: string;
    unitG?: string;
    unitL?: string;
    unitM?: string;
    unitH?: string;
    unitBox?: string;
    unitPack?: string;
    accept?: string;
    adjusting?: string;
    close?: string;
    adjustmentCreated?: string;
    adjustmentError?: string;
    noRecordId?: string;
};

type InventoryAdjustmentModalProps = {
    item: InventoryAdjustmentItem | null;
    labels: InventoryAdjustmentModalLabels;
    onClose: () => void;
};

const unitOptions = [
    { value: "UND", labelKey: "unitUnd" },
    { value: "KG", labelKey: "unitKg" },
    { value: "G", labelKey: "unitG" },
    { value: "L", labelKey: "unitL" },
    { value: "M", labelKey: "unitM" },
    { value: "H", labelKey: "unitH" },
    { value: "CAJA", labelKey: "unitBox" },
    { value: "PAQ", labelKey: "unitPack" },
] as const;

function getLabel(
    labels: InventoryAdjustmentModalLabels,
    key: string,
    fallback: string
) {
    return labels[key] ?? fallback;
}

function getTodayInputValue() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    return localDate.toISOString().slice(0, 10);
}

function getStringValue(value: unknown) {
    return value === null || value === undefined ? "" : String(value);
}

function getDefaultUnitOfMeasure(item: InventoryAdjustmentItem | null) {
    const unitOfMeasure = getStringValue(item?.base_unit_of_measure)
        .trim()
        .toUpperCase();

    return unitOfMeasure || "UND";
}

export default function InventoryAdjustmentModal({
    item,
    labels,
    onClose,
}: InventoryAdjustmentModalProps) {
    const router = useRouter();

    const [postingDate, setPostingDate] = useState(getTodayInputValue);
    const [entryType, setEntryType] = useState("");
    const [documentNo, setDocumentNo] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unitOfMeasure, setUnitOfMeasure] = useState(() =>
        getDefaultUnitOfMeasure(item)
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const itemCode = useMemo(() => getStringValue(item?.code), [item]);
    const itemDescription = useMemo(
        () => getStringValue(item?.description),
        [item]
    );

    useEffect(() => {
        setPostingDate(getTodayInputValue());
        setEntryType("");
        setDocumentNo("");
        setQuantity("");
        setUnitOfMeasure(getDefaultUnitOfMeasure(item));
        setMessage(null);
        setErrorMessage(null);
    }, [item]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!item) {
            setErrorMessage(
                getLabel(labels, "noRecordId", "No se ha podido identificar el artículo.")
            );
            return;
        }

        setIsSubmitting(true);
        setMessage(null);
        setErrorMessage(null);

        const payload: CreateInventoryAdjustmentInput = {
            itemId: item.id,
            postingDate,
            entryType: entryType as CreateInventoryAdjustmentInput["entryType"],
            documentNo,
            quantity,
            unitOfMeasure,
        };

        const result = await createInventoryAdjustmentAction(payload);

        setIsSubmitting(false);

        if (!result.ok) {
            setErrorMessage(
                `${getLabel(labels, "adjustmentError", "Error al crear ajuste")}: ${result.error
                }`
            );
            return;
        }

        setDocumentNo("");
        setQuantity("");
        onClose();
        router.refresh();
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 px-4 py-6">
            <div className="w-full max-w-lg rounded-3xl border-4 border-primary-app bg-white p-1 shadow-[8px_8px_0_rgba(63,79,36,0.28)]">
                <div className="rounded-[1.25rem] border border-app-border bg-app p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-primary-app">
                                {getLabel(
                                    labels,
                                    "inventoryAdjustmentTitle",
                                    "Ajuste inventario"
                                )}
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-app-border px-3 py-1 text-xs font-semibold text-primary-app transition hover:bg-app-soft"
                        >
                            {getLabel(labels, "close", "Cerrar")}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-xs font-semibold text-app">
                                {getLabel(labels, "selectedItem", "Artículo")}
                                <input
                                    value={itemCode}
                                    readOnly
                                    className="input-app mt-1 cursor-not-allowed bg-app-soft px-3 py-2 text-sm"
                                />
                            </label>

                            <label className="block text-xs font-semibold text-app">
                                {getLabel(labels, "unitOfMeasure", "Unidad de medida")}
                                <select
                                    value={unitOfMeasure}
                                    onChange={(event) => setUnitOfMeasure(event.target.value)}
                                    className="input-app mt-1 cursor-not-allowed bg-app-soft px-3 py-2 text-sm text-app-muted"
                                    disabled
                                    required
                                >
                                    {unitOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {getLabel(labels, option.labelKey, option.value)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label className="block text-xs font-semibold text-app">
                            {getLabel(labels, "selectedItemDescription", "Descripción")}
                            <input
                                value={itemDescription}
                                readOnly
                                className="input-app mt-1 cursor-not-allowed bg-app-soft px-3 py-2 text-sm"
                            />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-xs font-semibold text-app">
                                {getLabel(labels, "postingDate", "Fecha de registro")}
                                <input
                                    type="date"
                                    value={postingDate}
                                    onChange={(event) => setPostingDate(event.target.value)}
                                    className="input-app mt-1 px-3 py-2 text-sm"
                                    required
                                />
                            </label>

                            <label className="block text-xs font-semibold text-app">
                                {getLabel(labels, "adjustmentEntryType", "Tipo")}
                                <select
                                    value={entryType}
                                    onChange={(event) => setEntryType(event.target.value)}
                                    className="input-app mt-1 px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">-</option>
                                    <option value="in">
                                        {getLabel(labels, "adjustmentEntryTypeIn", "Entrada")}
                                    </option>
                                    <option value="out">
                                        {getLabel(labels, "adjustmentEntryTypeOut", "Salida")}
                                    </option>
                                </select>
                            </label>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-xs font-semibold text-app">
                                {getLabel(labels, "documentNo", "Nº documento")}
                                <input
                                    value={documentNo}
                                    onChange={(event) => setDocumentNo(event.target.value)}
                                    className="input-app mt-1 px-3 py-2 text-sm"
                                    required
                                />
                            </label>

                            <label className="block text-xs font-semibold text-app">
                                {getLabel(labels, "quantity", "Cantidad")}
                                <input
                                    value={quantity}
                                    onChange={(event) => setQuantity(event.target.value)}
                                    className="input-app mt-1 px-3 py-2 text-sm"
                                    inputMode="decimal"
                                    required
                                />
                            </label>
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

                        <div className="flex justify-end gap-2 pt-1">
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
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? getLabel(labels, "adjusting", "Ajustando...")
                                    : getLabel(labels, "accept", "Aceptar")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
