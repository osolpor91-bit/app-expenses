"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  updateItemBalanceEntryAction,
  type UpdateItemBalanceEntryInput,
} from "./actions";

export type ItemBalanceEntryEditRecord = {
  id: string;
  item_code?: unknown;
  item_description?: unknown;
  created_at?: unknown;
  quantity?: unknown;
  comment?: unknown;
  unit_of_measure?: unknown;
};

type ItemBalanceEntryEditModalLabels = Record<string, string | undefined>;

type ItemBalanceEntryEditModalProps = {
  entry: ItemBalanceEntryEditRecord;
  labels: ItemBalanceEntryEditModalLabels;
  onClose: () => void;
};

function getLabel(
  labels: ItemBalanceEntryEditModalLabels,
  key: string,
  fallback: string
) {
  return labels[key] ?? fallback;
}

function getDateInputValue(value: unknown) {
  const match = String(value ?? "").match(/^(\d{4}-\d{2}-\d{2})/);

  return match?.[1] ?? "";
}

export default function ItemBalanceEntryEditModal({
  entry,
  labels,
  onClose,
}: ItemBalanceEntryEditModalProps) {
  const router = useRouter();
  const [postingDate, setPostingDate] = useState(() =>
    getDateInputValue(entry.created_at)
  );
  const [quantity, setQuantity] = useState(() =>
    String(entry.quantity ?? "")
  );
  const [comment, setComment] = useState(() =>
    String(entry.comment ?? "")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const input: UpdateItemBalanceEntryInput = {
      id: entry.id,
      postingDate,
      quantity,
      comment,
    };

    try {
      const result = await updateItemBalanceEntryAction(input);

      if (!result.ok) {
        setErrorMessage(
          `${getLabel(
            labels,
            "modifyError",
            "Error al modificar el movimiento"
          )}: ${result.error}`
        );
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setErrorMessage(
        getLabel(labels, "modifyError", "Error al modificar el movimiento")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="w-full max-w-lg rounded-3xl border-4 border-primary-app bg-white p-1 shadow-[8px_8px_0_rgba(63,79,36,0.28)]">
        <div className="rounded-[1.25rem] border border-app-border bg-app p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-primary-app">
                {getLabel(labels, "modifyTitle", "Modificar movimiento")}
              </h2>
              <p className="mt-1 text-xs font-semibold text-muted-app">
                {String(entry.item_code ?? "").trim()}
                {entry.item_description ? " · " : ""}
                {String(entry.item_description ?? "").trim()}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-app-border px-3 py-1 text-xs font-semibold text-primary-app transition hover:bg-app-soft"
              disabled={isSubmitting}
            >
              {getLabel(labels, "close", "Cerrar")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="block text-xs font-semibold text-app">
                {getLabel(labels, "postingDate", "Fecha de registro")}
                <input
                  type="date"
                  value={postingDate}
                  onChange={(event) => setPostingDate(event.target.value)}
                  className="input-app mt-1 px-3 py-2 text-sm"
                  required
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </label>

              <div className="block text-xs font-semibold text-app">
                {getLabel(labels, "unitOfMeasure", "Unidad")}
                <div className="mt-1 rounded-xl border border-app-border bg-app-soft px-3 py-2 text-sm font-bold text-primary-app">
                  {String(entry.unit_of_measure ?? "").trim() || "-"}
                </div>
              </div>
            </div>

            <label className="block text-xs font-semibold text-app">
              {getLabel(labels, "comment", "Comentario")}
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="input-app mt-1 min-h-24 px-3 py-2 text-sm"
                maxLength={1000}
                placeholder={getLabel(
                  labels,
                  "commentPlaceholder",
                  "Comentario libre"
                )}
                disabled={isSubmitting}
              />
            </label>

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
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
                className="btn-primary-app px-4 py-2 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? getLabel(labels, "saving", "Guardando...")
                  : getLabel(labels, "accept", "Aceptar")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
