"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import AutocompleteInput from "../components/AutocompleteInput";
import { formatDecimalValue } from "@/lib/formatters/fieldFormatters";
import {
  treasuryMovementTypes,
  type TreasuryMovementType,
} from "@/lib/treasury/treasuryGeneral";
import {
  evaluateDecimalArithmeticExpression,
  hasDecimalArithmeticExpression,
} from "@/lib/validation/decimalArithmeticExpression";

import {
  createTreasuryMovementAction,
  type CreateTreasuryMovementInput,
  updateTreasuryMovementAction,
} from "./actions";
import { uploadEntityDocumentFactBoxAction } from "../actions/entityDocumentFactBoxActions";

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
  is_expense_closed?: unknown;
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

const maxAttachmentFileSizeBytes = 10 * 1024 * 1024;

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

function parseBooleanValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return String(value ?? "").trim().toLowerCase() === "true";
}

function formatTreasuryAmountExpressionResult(value: string) {
  const formattedValue = formatDecimalValue(value, 2);

  return formattedValue === "-" ? value : formattedValue;
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
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
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
  const [isExpenseClosed, setIsExpenseClosed] = useState(() =>
    parseBooleanValue(movement?.is_expense_closed)
  );
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [createdMovementId, setCreatedMovementId] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formLockedAfterCreate = !isEditing && Boolean(createdMovementId);
  const requiredAccountGroup = getRequiredAccountGroup(treasuryType);
  const filteredAccountOptions = requiredAccountGroup
    ? accountOptions.filter(
        (account) => account.accountGroup === requiredAccountGroup
      )
    : [];
  const canCloseExpense = treasuryType === "Gastos Reales";

  function handleTreasuryTypeChange(nextTreasuryType: string) {
    setTreasuryType(nextTreasuryType);
    setErrorMessage(null);

    if (nextTreasuryType !== "Gastos Reales") {
      setIsExpenseClosed(false);
    }

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

  function handleAttachmentButtonClick() {
    if (isSubmitting) {
      return;
    }

    attachmentInputRef.current?.click();
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const fileInput = event.currentTarget;
    const selectedFile = fileInput.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (selectedFile.size > maxAttachmentFileSizeBytes) {
      setAttachmentFile(null);
      setErrorMessage(
        getLabel(
          labels,
          "treasuryMovementAttachmentTooLarge",
          "El archivo no puede superar los 10 MB."
        )
      );
      fileInput.value = "";
      return;
    }

    setAttachmentFile(selectedFile);
    setErrorMessage(null);
  }

  function handleRemoveAttachment() {
    setAttachmentFile(null);
    setErrorMessage(null);

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  }

  function resolveAmountExpression(rawAmount: string) {
    if (!hasDecimalArithmeticExpression(rawAmount)) {
      return rawAmount;
    }

    const expressionResult = evaluateDecimalArithmeticExpression(rawAmount);

    if (!expressionResult.ok) {
      setErrorMessage(expressionResult.error);
      return null;
    }

    const formattedAmount = formatTreasuryAmountExpressionResult(
      expressionResult.value
    );

    setAmount(formattedAmount);
    return formattedAmount;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const resolvedAmount = resolveAmountExpression(amount);

    if (resolvedAmount === null) {
      return;
    }

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
      amount: resolvedAmount,
      movementDate,
      accountId,
      paidByMemberId,
      comment,
      isExpenseClosed: canCloseExpense && isExpenseClosed,
    };

    let savedMovementId = movement?.id ?? createdMovementId;

    try {
      if (movement?.id) {
        const updateResult = await updateTreasuryMovementAction({
          id: movement.id,
          ...input,
        });

        if (!updateResult.ok) {
          setErrorMessage(
            `${getLabel(
              labels,
              "treasuryMovementUpdateError",
              "Error al modificar el movimiento"
            )}: ${updateResult.error}`
          );
          return;
        }
      } else if (!savedMovementId) {
        const createResult = await createTreasuryMovementAction(input);

        if (!createResult.ok) {
          setErrorMessage(
            `${getLabel(
              labels,
              "treasuryMovementError",
              "Error al crear el movimiento"
            )}: ${createResult.error}`
          );
          return;
        }

        savedMovementId = createResult.data.id;
        setCreatedMovementId(savedMovementId);
      }

      if (!isEditing && attachmentFile && savedMovementId) {
        const formData = new FormData();
        formData.append("file", attachmentFile);

        const uploadResult = await uploadEntityDocumentFactBoxAction(
          {
            entityKey: "treasuryGeneralMovements",
            recordId: savedMovementId,
            factBoxKey: "attachments",
          },
          formData
        );

        if (!uploadResult.ok) {
          setErrorMessage(
            `${getLabel(
              labels,
              "treasuryMovementCreatedAttachmentPending",
              "El movimiento se ha creado, pero el adjunto no se ha podido subir."
            )} ${getLabel(
              labels,
              "treasuryMovementAttachmentUploadError",
              "Puedes volver a intentarlo sin crear otro movimiento."
            )}: ${uploadResult.error}`
          );
          return;
        }
      }

      onClose();
      router.refresh();
    } catch {
      setErrorMessage(
        !isEditing && savedMovementId
          ? `${getLabel(
              labels,
              "treasuryMovementCreatedAttachmentPending",
              "El movimiento se ha creado, pero el adjunto no se ha podido subir."
            )} ${getLabel(
              labels,
              "treasuryMovementAttachmentUploadError",
              "Puedes volver a intentarlo sin crear otro movimiento."
            )}`
          : getLabel(
              labels,
              isEditing
                ? "treasuryMovementUpdateError"
                : "treasuryMovementError",
              isEditing
                ? "Error al modificar el movimiento"
                : "Error al crear el movimiento"
            )
      );
    } finally {
      setIsSubmitting(false);
    }
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
                  disabled={isSubmitting || formLockedAfterCreate}
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
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setErrorMessage(null);
                  }}
                  onBlur={(event) => {
                    resolveAmountExpression(event.target.value);
                  }}
                  className="input-app mt-1 px-3 py-2 text-sm"
                  inputMode="decimal"
                  placeholder="0,00"
                  required
                  disabled={isSubmitting || formLockedAfterCreate}
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
                disabled={isSubmitting || formLockedAfterCreate}
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
                  isSubmitting ||
                  formLockedAfterCreate
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
                disabled={
                  memberOptions.length === 0 ||
                  isSubmitting ||
                  formLockedAfterCreate
                }
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
                disabled={isSubmitting || formLockedAfterCreate}
              />
            </label>

            {canCloseExpense ? (
              <label className="flex items-center gap-2 text-xs font-semibold text-app">
                <input
                  type="checkbox"
                  checked={isExpenseClosed}
                  onChange={(event) =>
                    setIsExpenseClosed(event.target.checked)
                  }
                  className="h-4 w-4 accent-primary-app"
                  disabled={isSubmitting || formLockedAfterCreate}
                />
                {getLabel(
                  labels,
                  "treasuryMovementExpenseClosed",
                  "Gasto cerrado"
                )}
              </label>
            ) : null}

            {!isEditing ? (
              <input
                ref={attachmentInputRef}
                type="file"
                className="hidden"
                onChange={handleAttachmentChange}
              />
            ) : null}

            {!isEditing && attachmentFile ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-soft px-3 py-2">
                <p className="min-w-0 truncate text-xs text-app-muted">
                  <span className="font-semibold text-primary-app">
                    {getLabel(
                      labels,
                      "treasuryMovementAttachmentSelected",
                      "Adjunto"
                    )}
                    :
                  </span>{" "}
                  {attachmentFile.name}
                </p>

                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="shrink-0 text-xs font-semibold text-red-700 hover:underline"
                  disabled={isSubmitting}
                >
                  {getLabel(
                    labels,
                    "treasuryMovementAttachmentRemove",
                    "Quitar"
                  )}
                </button>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              {isEditing ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary-app px-4 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  {getLabel(labels, "close", "Cerrar")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAttachmentButtonClick}
                  className="btn-secondary-app px-4 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  {getLabel(
                    labels,
                    "treasuryMovementAttachmentAction",
                    "Adjuntar"
                  )}
                </button>
              )}

              <button
                type="submit"
                className="btn-primary-app px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  isSubmitting ||
                  !requiredAccountGroup ||
                  filteredAccountOptions.length === 0 ||
                  memberOptions.length === 0 ||
                  (formLockedAfterCreate && !attachmentFile)
                }
              >
                {isSubmitting
                  ? getLabel(
                      labels,
                      isEditing
                        ? "treasuryMovementUpdating"
                        : createdMovementId
                          ? "treasuryMovementAttachmentUploading"
                          : "treasuryMovementSaving",
                      isEditing
                        ? "Modificando..."
                        : createdMovementId
                          ? "Subiendo adjunto..."
                          : "Guardando..."
                    )
                  : getLabel(
                      labels,
                      isEditing
                        ? "treasuryMovementUpdate"
                        : createdMovementId
                          ? "treasuryMovementAttachmentRetry"
                          : "accept",
                      isEditing
                        ? "Modificar"
                        : createdMovementId
                          ? "Reintentar adjunto"
                          : "Aceptar"
                    )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
