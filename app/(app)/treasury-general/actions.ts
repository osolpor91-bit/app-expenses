"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";
import {
  isTreasuryMovementType,
  type TreasuryMovementType,
} from "@/lib/treasury/treasuryGeneral";
import { normalizeDecimalField } from "@/lib/validation/fieldValidations";

export type CreateTreasuryMovementInput = {
  treasuryType: TreasuryMovementType;
  amount: string;
  movementDate: string;
  accountId: string;
  paidByMemberId: string;
  comment: string;
};

export type UpdateTreasuryMovementInput = CreateTreasuryMovementInput & {
  id: string;
};

function isValidMovementDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isFinite(date.getTime());
}

async function saveTreasuryMovement({
  input,
  movementId = null,
}: {
  input: CreateTreasuryMovementInput;
  movementId?: string | null;
}): Promise<EntityOperationResult<{ id: string }>> {
  const treasuryType = String(input.treasuryType ?? "").trim();
  const movementDate = String(input.movementDate ?? "").trim();
  const accountId = String(input.accountId ?? "").trim();
  const paidByMemberId = String(input.paidByMemberId ?? "").trim();
  const comment = String(input.comment ?? "").trim();
  const normalizedAmount = normalizeDecimalField(input.amount);

  if (!isTreasuryMovementType(treasuryType)) {
    return entityOperationError("El tipo de movimiento es obligatorio.");
  }

  if (!normalizedAmount) {
    return entityOperationError("El importe es obligatorio.");
  }

  const amount = Number(normalizedAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return entityOperationError("El importe debe ser mayor que cero.");
  }

  if (!isValidMovementDate(movementDate)) {
    return entityOperationError("La fecha del movimiento no es válida.");
  }

  if (!accountId) {
    return entityOperationError("La cuenta contable es obligatoria.");
  }

  if (!paidByMemberId) {
    return entityOperationError("El miembro que ha pagado es obligatorio.");
  }

  if (comment.length > 1000) {
    return entityOperationError(
      "El comentario no puede superar los 1.000 caracteres."
    );
  }

  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError(
      "No hay una empresa activa. Selecciona una empresa para registrar el movimiento."
    );
  }

  const { data: account, error: accountError } = await supabase
    .from("chart_of_accounts")
    .select("id, code, description, account_group")
    .eq("id", accountId)
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .eq("is_heading", false)
    .maybeSingle();

  if (accountError) {
    return entityOperationError(accountError.message);
  }

  if (!account) {
    return entityOperationError(
      "La cuenta contable no existe o no admite movimientos."
    );
  }

  const expectedAccountGroup = treasuryType.startsWith("Gastos")
    ? "expenses"
    : "income";

  if (account.account_group !== expectedAccountGroup) {
    return entityOperationError(
      expectedAccountGroup === "expenses"
        ? "Para un gasto debes seleccionar una cuenta del grupo 6: Gastos."
        : "Para un ingreso debes seleccionar una cuenta del grupo 7: Ingresos."
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("treasury_members")
    .select("id")
    .eq("id", paidByMemberId)
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .maybeSingle();

  if (memberError) {
    return entityOperationError(memberError.message);
  }

  if (!member) {
    return entityOperationError(
      "El miembro seleccionado no existe o pertenece a otra empresa."
    );
  }

  const accountNo = String(account.code ?? "").trim();
  const accountDescription = String(account.description ?? "").trim();

  if (!accountNo || !accountDescription) {
    return entityOperationError(
      "La cuenta contable debe tener código y descripción."
    );
  }

  const movementPayload = {
    treasury_type: treasuryType,
    account_id: account.id,
    account_no: accountNo,
    account_description: accountDescription,
    entry_description: comment || null,
    amount: normalizedAmount,
    movement_date: movementDate,
    paid_by_member_id: member.id,
  };

  const mutation = movementId
    ? supabase
        .from("treasury_general_movements")
        .update(movementPayload)
        .eq("id", movementId)
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
    : supabase.from("treasury_general_movements").insert({
        tenant_id: tenant.id,
        company_id: activeCompany.id,
        ...movementPayload,
      });

  const { data, error } = await mutation.select("id").single();

  if (error) {
    return entityOperationError(error.message);
  }

  if (!data?.id) {
    return entityOperationError(
      movementId
        ? "No se ha podido actualizar el movimiento."
        : "No se ha podido crear el movimiento."
    );
  }

  revalidatePath("/treasury-general");
  revalidatePath("/treasury-general/movements");
  revalidatePath("/dashboard");

  return entityOperationOk({
    id: String(data.id),
  });
}

export async function createTreasuryMovementAction(
  input: CreateTreasuryMovementInput
): Promise<EntityOperationResult<{ id: string }>> {
  return saveTreasuryMovement({
    input,
  });
}

export async function updateTreasuryMovementAction(
  input: UpdateTreasuryMovementInput
): Promise<EntityOperationResult<{ id: string }>> {
  const movementId = String(input.id ?? "").trim();

  if (!movementId) {
    return entityOperationError(
      "No se ha podido identificar el movimiento."
    );
  }

  return saveTreasuryMovement({
    input,
    movementId,
  });
}
