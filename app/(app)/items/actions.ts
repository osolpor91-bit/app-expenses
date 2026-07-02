"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";
import { normalizeDecimalField } from "@/lib/validation/fieldValidations";

type InventoryAdjustmentEntryType = "in" | "out";

export type CreateInventoryAdjustmentInput = {
  itemId: string;
  postingDate: string;
  entryType: InventoryAdjustmentEntryType;
  documentNo: string;
  quantity: string;
  unitOfMeasure: string;
};

function isValidEntryType(value: string): value is InventoryAdjustmentEntryType {
  return value === "in" || value === "out";
}

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

export async function createInventoryAdjustmentAction(
  input: CreateInventoryAdjustmentInput
): Promise<EntityOperationResult<{ id: string }>> {
  const itemId = input.itemId.trim();
  const postingDate = input.postingDate.trim();
  const entryType = input.entryType.trim();
  const documentNo = input.documentNo.trim();
  const normalizedQuantity = normalizeDecimalField(input.quantity);

  if (!itemId) {
    return entityOperationError("No se ha podido identificar el artículo.");
  }

  if (!isValidPostingDate(postingDate)) {
    return entityOperationError("La fecha de registro no es válida.");
  }

  if (!isValidEntryType(entryType)) {
    return entityOperationError("El tipo de ajuste es obligatorio.");
  }

  if (!documentNo) {
    return entityOperationError("El Nº documento es obligatorio.");
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
      "No hay una empresa activa. Selecciona una empresa para ajustar inventario."
    );
  }

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("id, code, description, base_unit_of_measure")
    .eq("id", itemId)
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .single();

  if (itemError) {
    return entityOperationError(itemError.message);
  }

  if (!item) {
    return entityOperationError("No se ha encontrado el artículo.");
  }

  const unitOfMeasure = String(item.base_unit_of_measure ?? "")
    .trim()
    .toUpperCase();

  if (!unitOfMeasure) {
    return entityOperationError("La unidad de medida base es obligatoria.");
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("item_balance_entries")
    .insert({
      tenant_id: tenant.id,
      company_id: activeCompany.id,
      item_id: item.id,
      item_code: item.code,
      item_description: item.description,
      created_at: getPostingDateTime(postingDate),
      updated_at: now,
      entry_type: entryType,
      document_no: documentNo,
      origin: "Ajuste",
      quantity: normalizedQuantity,
      unit_of_measure: unitOfMeasure,
    })
    .select("id")
    .single();

  if (error) {
    return entityOperationError(error.message);
  }

  if (!data?.id) {
    return entityOperationError("No se ha podido crear el ajuste.");
  }

  revalidatePath("/items");
  revalidatePath("/item-balance-entries");
  revalidatePath("/dashboard");

  return entityOperationOk({
    id: data.id,
  });
}
