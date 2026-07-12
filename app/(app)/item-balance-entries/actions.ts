"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";
import { normalizeDecimalField } from "@/lib/validation/fieldValidations";

export type UpdateItemBalanceEntryInput = {
  id: string;
  postingDate: string;
  quantity: string;
  comment: string;
};

function isValidPostingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isFinite(date.getTime());
}

function getPostingDateTime(postingDate: string) {
  return `${postingDate}T00:00:00.000Z`;
}

export async function updateItemBalanceEntryAction(
  input: UpdateItemBalanceEntryInput
): Promise<EntityOperationResult<null>> {
  const id = input.id.trim();
  const postingDate = input.postingDate.trim();
  const comment = input.comment.trim();
  const normalizedQuantity = normalizeDecimalField(input.quantity);

  if (!id) {
    return entityOperationError("No se ha podido identificar el movimiento.");
  }

  if (!isValidPostingDate(postingDate)) {
    return entityOperationError("La fecha de registro no es válida.");
  }

  if (!normalizedQuantity) {
    return entityOperationError("La cantidad es obligatoria.");
  }

  const quantityNumber = Number(normalizedQuantity);

  if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
    return entityOperationError("La cantidad debe ser mayor que cero.");
  }

  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError(
      "No hay una empresa activa. Selecciona una empresa para modificar movimientos."
    );
  }

  const { data: existingEntry, error: readError } = await supabase
    .from("item_balance_entries")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .maybeSingle();

  if (readError) {
    return entityOperationError(readError.message);
  }

  if (!existingEntry) {
    return entityOperationError("No se ha encontrado el movimiento.");
  }

  const { error: updateError } = await supabase
    .from("item_balance_entries")
    .update({
      created_at: getPostingDateTime(postingDate),
      quantity: normalizedQuantity,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id);

  if (updateError) {
    return entityOperationError(updateError.message);
  }

  revalidatePath("/item-balance-entries");
  revalidatePath("/items");
  revalidatePath("/reports/inventory-by-product");

  return entityOperationOk(null);
}
