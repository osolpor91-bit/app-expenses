"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import AutocompleteInput from "../components/AutocompleteInput";
import {
  treasuryMovementTypes,
  type TreasuryMovementType,
} from "@/lib/treasury/treasuryGeneral";

import {
  createTreasuryMovementAction,
  type CreateTreasuryMovementInput,
  updateTreasuryMovementAction,
} from "./actions";

export type TreasuryAccountOption = {
  value: string;
  label: string;
  menuLabel: string;
  searchLabel: string;
  accountGroup: "expenses" | "income";
};

export type TreasuryMemberOption = {
  value: string;
  label: string;
  menuLabel?: string;
  searchLabel?: string;
};

export type TreasuryMovementEditRecord = {
  id: string;
  treasury_type?: unknown;
  amount?: unknown;
  movement_date?: unknown;
  account_id?: unknown;
  paid_by_member_id?: unknown;
  entry_description?: unknown;
};

type TreasuryMovementModalLabels = Record<string, string | undefined>;

type TreasuryMovementModalProps = {
  accountOptions: TreasuryAccountOption[];
  memberOptions: TreasuryMemberOption[];
  defaultMemberId: string;
  defaultTreasuryType?: string;
  movement?: TreasuryMovementEditRecord | null;
  labels: TreasuryMovementModalLabels;
  onClose: () => void;
};

const treasuryTypeLabelKeys: Record<TreasuryMovementType, string> = {
  "Ingresos Reales": "treasuryTypeRealIncome",
  "Ingresos Previstos": "treasuryTypeExpectedIncome",
  "Gastos Reales": "treasuryTypeRealExpense",
  "Gastos Previstos": "treasuryTypeExpectedExpense",
};

function getRequiredAccountGroup(
  treasuryType: string
): TreasuryAccountOption["accountGroup"] | null {
  if (treasuryType.startsWith("Gastos")) {
    return "expenses";
  }

  if (treasuryType.startsWith("Ingresos")) {
    return "income";
  }

  return null;
}

function getLabel(
  labels: TreasuryMovementModalLabels,
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

export default function TreasuryMovementModal({
  accountOptions,
  memberOptions,
  defaultMemberId,
  defaultTreasuryType = "",
  movement = null,
  labels,
  onClose,
}: TreasuryMovementModalProps) {
  const router = useRouter();
  const isEditing = Boolean(movement?.id);
  const [treasuryType, setTreasuryType] = useState(() =>
    String(movement?.treasury_type ?? defaultTreasuryType)
  );
  const [amount, setAmount] = useState(() =>
    String(movement?.amount ?? "")
  );
  const [movementDate, setMovementDate] = useState(() =>
    String(movement?.movement_date ?? getTodayInputValue())
  );
  const [accountId, setAccountId] = useState(() =>
    String(movement?.account_id ?? "")
  );
  const [paidByMemberId, setPaidByMemberId] = useState(() =>
    String(movement?.paid_by_member_id ?? defaultMemberId)
  );
  const [comment, setComment] = useState(() =>
    String(movement?.entry_description ?? "")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requiredAccountGroup = getRequiredAccountGroup(treasuryType);
  const filteredAccountOptions = requiredAccountGroup
    ? accountOptions.filter(
        (account) => account.accountGroup === requiredAccountGroup
      )
    : [];

  function handleTreasuryTypeChange(nextTreasuryType: string) {
    setTreasuryType(nextTreasuryType);
    setErrorMessage(null);

    const nextAccountGroup = getRequiredAccountGroup(nextTreasuryType);
    const currentAccountIsValid = accountOptions.some(
      (account) =>
        account.value === accountId &&
        account.accountGroup === nextAccountGroup
    );

    if (accountId && !currentAccountIsValid) {
      setAccountId("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!accountId) {
      setErrorMessage(
        getLabel(
          labels,
          "treasuryMovementAccountRequired",
          "La cuenta contable es obligatoria."
        )
      );
      return;
    }

    if (
      !filteredAccountOptions.some((account) => account.value === accountId)
    ) {
      setErrorMessage(
        getLabel(
          labels,
          "treasuryMovementAccountTypeMismatch",
          "La cuenta contable no corresponde al tipo de movimiento."
        )
      );
      return;
    }

    if (!paidByMemberId) {
      setErrorMessage(
        getLabel(
          labels,
          "treasuryMovementPaidByRequired",
          "El miembro que ha pagado es obligatorio."
        )
      );
      return;
    }

    setIsSubmitting(true);

    const input: CreateTreasuryMovementInput = {
      treasuryType:
        treasuryType as CreateTreasuryMovementInput["treasuryType"],
      amount,
      movementDate,
      accountId,
      paidByMemberId,
      comment,
    };

    const result = movement?.id
      ? await updateTreasuryMovementAction({
          id: movement.id,
          ...input,
        })
      : await createTreasuryMovementAction(input);

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(
        `${getLabel(
          labels,
          isEditing
            ? "treasuryMovementUpdateError"
            : "treasuryMovementError",
          isEditing
            ? "Error al modificar el movimiento"
            : "Error al crear el movimiento"
        )}: ${result.error}`
      );
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border-4 border-primary-app bg-white p-1 shadow-[8px_8px_0_rgba(63,79,36,0.28)]">
        <div className="rounded-[1.25rem] border border-app-border bg-app p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-lg font-black uppercase tracking-tight text-primary-app">
              {getLabel(
                labels,
                isEditing
                  ? "treasuryMovementEditTitle"
                  : "treasuryMovementTitle",
                isEditing
                  ? "Modificar movimiento de tesorería"
                  : "Nuevo movimiento de tesorería"
              )}
            </h2>

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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-app">
                {getLabel(labels, "treasuryMovementType", "Tipo")}
                <select
                  value={treasuryType}
                  onChange={(event) =>
                    handleTreasuryTypeChange(event.target.value)
                  }
                  className="input-app mt-1 px-3 py-2 text-sm"
                  required
                >
                  <option value="">-</option>
                  {treasuryMovementTypes.map((type) => (
                    <option key={type} value={type}>
                      {getLabel(labels, treasuryTypeLabelKeys[type], type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-app">
                {getLabel(labels, "treasuryMovementAmount", "Importe")}
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="input-app mt-1 px-3 py-2 text-sm"
                  inputMode="decimal"
                  placeholder="0,00"
                  required
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-app">
              {getLabel(labels, "treasuryMovementDate", "Fecha")}
              <input
                type="date"
                value={movementDate}
                onChange={(event) => setMovementDate(event.target.value)}
                className="input-app mt-1 px-3 py-2 text-sm"
                required
              />
            </label>

            <label className="block text-xs font-semibold text-app">
              {getLabel(labels, "treasuryMovementAccount", "Cuenta contable")}
              <AutocompleteInput
                value={accountId}
                options={filteredAccountOptions}
                onValueChange={setAccountId}
                className="input-app mt-1 px-3 py-2 text-sm"
                placeholder={getLabel(
                  labels,
                  requiredAccountGroup
                    ? "treasuryMovementAccountPlaceholder"
                    : "treasuryMovementSelectTypeFirst",
                  requiredAccountGroup
                    ? "Buscar cuenta por descripción"
                    : "Selecciona primero el tipo"
                )}
                required
                disabled={
                  !requiredAccountGroup ||
                  filteredAccountOptions.length === 0 ||
                  isSubmitting
                }
              />
            </label>

            {requiredAccountGroup && filteredAccountOptions.length === 0 ? (
              <p className="text-xs text-amber-700">
                {getLabel(
                  labels,
                  requiredAccountGroup === "expenses"
                    ? "treasuryMovementNoExpenseAccounts"
                    : "treasuryMovementNoIncomeAccounts",
                  requiredAccountGroup === "expenses"
                    ? "No hay cuentas disponibles del grupo 6: Gastos."
                    : "No hay cuentas disponibles del grupo 7: Ingresos."
                )}
              </p>
            ) : null}

            <label className="block text-xs font-semibold text-app">
              {getLabel(labels, "treasuryMovementPaidBy", "Pagado por")}
              <AutocompleteInput
                value={paidByMemberId}
                options={memberOptions}
                onValueChange={setPaidByMemberId}
                className="input-app mt-1 px-3 py-2 text-sm"
                placeholder={getLabel(
                  labels,
                  "treasuryMovementPaidByPlaceholder",
                  "Buscar miembro por nombre o apellidos"
                )}
                required
                disabled={memberOptions.length === 0 || isSubmitting}
              />
            </label>

            {memberOptions.length === 0 ? (
              <p className="text-xs text-amber-700">
                {getLabel(
                  labels,
                  "treasuryMovementNoMembers",
                  "No hay miembros disponibles. Crea al menos uno en Configuraciones."
                )}
              </p>
            ) : null}

            <label className="block text-xs font-semibold text-app">
              {getLabel(labels, "treasuryMovementComment", "Comentario")}
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="input-app mt-1 min-h-24 px-3 py-2 text-sm"
                maxLength={1000}
                placeholder={getLabel(
                  labels,
                  "treasuryMovementCommentPlaceholder",
                  "Comentario opcional"
                )}
              />
            </label>

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
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
                disabled={
                  isSubmitting ||
                  !requiredAccountGroup ||
                  filteredAccountOptions.length === 0 ||
                  memberOptions.length === 0
                }
              >
                {isSubmitting
                  ? getLabel(
                      labels,
                      isEditing
                        ? "treasuryMovementUpdating"
                        : "treasuryMovementSaving",
                      isEditing ? "Modificando..." : "Guardando..."
                    )
                  : getLabel(
                      labels,
                      isEditing ? "treasuryMovementUpdate" : "accept",
                      isEditing ? "Modificar" : "Aceptar"
                    )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
