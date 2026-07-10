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
  comment?: string;
};

export type CreateBulkInventoryAdjustmentInput = {
  comment: string;
  lines: {
    itemId: string;
    actualQuantity: string;
  }[];
};

const quantityDifferenceThreshold = 0.000001;

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

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getSignedInventoryQuantity(entry: Record<string, unknown>) {
  const quantity = Number(entry.quantity ?? 0);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return entry.entry_type === "out" ? -quantity : quantity;
}

function formatAdjustmentQuantity(value: number) {
  const roundedValue = Math.round(value * 1000000) / 1000000;

  return String(roundedValue);
}

export async function createInventoryAdjustmentAction(
  input: CreateInventoryAdjustmentInput
): Promise<EntityOperationResult<{ id: string }>> {
  const itemId = input.itemId.trim();
  const postingDate = input.postingDate.trim();
  const entryType = input.entryType.trim();
  const documentNo = input.documentNo.trim();
  const comment = input.comment?.trim() ?? "";
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
      comment: comment || null,
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

export async function createBulkInventoryAdjustmentAction(
  input: CreateBulkInventoryAdjustmentInput
): Promise<EntityOperationResult<{ count: number }>> {
  const comment = String(input.comment ?? "").trim();
  const lines = Array.isArray(input.lines) ? input.lines : [];

  if (!comment) {
    return entityOperationError("El comentario es obligatorio.");
  }

  if (lines.length === 0) {
    return entityOperationError("No hay artículos activos para ajustar.");
  }

  const actualQuantityByItemId = new Map<string, number>();

  for (const line of lines) {
    const itemId = line.itemId.trim();
    const normalizedActualQuantity = normalizeDecimalField(line.actualQuantity);
    const actualQuantity = Number(normalizedActualQuantity);

    if (!itemId) {
      return entityOperationError("No se ha podido identificar un artículo.");
    }

    if (
      !normalizedActualQuantity ||
      !Number.isFinite(actualQuantity) ||
      actualQuantity < 0
    ) {
      return entityOperationError(
        "El inventario real debe ser un número mayor o igual que cero."
      );
    }

    actualQuantityByItemId.set(itemId, actualQuantity);
  }

  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError(
      "No hay una empresa activa. Selecciona una empresa para ajustar inventario."
    );
  }

  const itemIds = Array.from(actualQuantityByItemId.keys());

  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id, code, description, base_unit_of_measure")
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .eq("is_active", true)
    .in("id", itemIds);

  if (itemsError) {
    return entityOperationError(itemsError.message);
  }

  if (!items || items.length === 0) {
    return entityOperationError("No hay artículos activos para ajustar.");
  }

  const unitByItemId = new Map(
    items.map((item) => [
      String(item.id),
      String(item.base_unit_of_measure ?? "").trim().toUpperCase(),
    ])
  );

  if (Array.from(unitByItemId.values()).some((unit) => !unit)) {
    return entityOperationError(
      "Todos los artículos activos deben tener unidad de medida base."
    );
  }

  const { data: balanceEntries, error: balanceEntriesError } = await supabase
    .from("item_balance_entries")
    .select("item_id, entry_type, quantity, unit_of_measure")
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .in("item_id", itemIds);

  if (balanceEntriesError) {
    return entityOperationError(balanceEntriesError.message);
  }

  const calculatedQuantityByItemId = new Map<string, number>();

  (balanceEntries ?? []).forEach((entry) => {
    const itemId = String(entry.item_id ?? "");
    const unitOfMeasure = String(entry.unit_of_measure ?? "")
      .trim()
      .toUpperCase();

    if (!itemId || unitOfMeasure !== unitByItemId.get(itemId)) {
      return;
    }

    calculatedQuantityByItemId.set(
      itemId,
      (calculatedQuantityByItemId.get(itemId) ?? 0) +
        getSignedInventoryQuantity(entry)
    );
  });

  const postingDate = getTodayInputValue();
  const now = new Date().toISOString();
  const movements = items
    .map((item) => {
      const itemId = String(item.id);
      const calculatedQuantity = calculatedQuantityByItemId.get(itemId) ?? 0;
      const actualQuantity = actualQuantityByItemId.get(itemId);

      if (actualQuantity === undefined) {
        return null;
      }

      const difference = actualQuantity - calculatedQuantity;

      if (Math.abs(difference) <= quantityDifferenceThreshold) {
        return null;
      }

      return {
        tenant_id: tenant.id,
        company_id: activeCompany.id,
        item_id: item.id,
        item_code: item.code,
        item_description: item.description,
        created_at: getPostingDateTime(postingDate),
        updated_at: now,
        entry_type: difference > 0 ? "in" : "out",
        document_no: "AJUSTE",
        comment,
        origin: "Ajuste",
        quantity: formatAdjustmentQuantity(Math.abs(difference)),
        unit_of_measure: unitByItemId.get(itemId),
      };
    })
    .filter((movement): movement is NonNullable<typeof movement> =>
      Boolean(movement)
    );

  if (movements.length === 0) {
    return entityOperationError("No hay diferencias que ajustar.");
  }

  const { error } = await supabase.from("item_balance_entries").insert(movements);

  if (error) {
    return entityOperationError(error.message);
  }

  revalidatePath("/items");
  revalidatePath("/item-balance-entries");
  revalidatePath("/dashboard");

  return entityOperationOk({
    count: movements.length,
  });
}
