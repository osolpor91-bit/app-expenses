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
  quantity: string;
  warehouseId: string;
  unitOfMeasure: string;
  comment?: string;
};

export type CreateBulkInventoryAdjustmentInput = {
  comment: string;
  originWarehouseId: string;
  destinationWarehouseId: string;
  lines: {
    itemId: string;
    sourceQuantity?: string;
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

async function readWarehouse({
  supabase,
  tenantId,
  companyId,
  warehouseId,
}: {
  supabase: Awaited<ReturnType<typeof requireCompanyContext>>["supabase"];
  tenantId: string;
  companyId: string;
  warehouseId: string;
}) {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, code, description, is_default")
    .eq("id", warehouseId)
    .eq("tenant_id", tenantId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    return entityOperationError(error.message);
  }

  if (!data) {
    return entityOperationError("No se ha encontrado el almacén.");
  }

  return entityOperationOk({
    id: String(data.id ?? ""),
    code: String(data.code ?? "").trim().toUpperCase(),
    description: String(data.description ?? "").trim(),
    isDefault: Boolean(data.is_default),
  });
}

async function readDefaultWarehouse({
  supabase,
  tenantId,
  companyId,
}: {
  supabase: Awaited<ReturnType<typeof requireCompanyContext>>["supabase"];
  tenantId: string;
  companyId: string;
}) {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, code, description, is_default")
    .eq("tenant_id", tenantId)
    .eq("company_id", companyId)
    .eq("is_default", true);

  if (error) {
    return entityOperationError(error.message);
  }

  if (!data || data.length === 0) {
    return entityOperationError(
      "No hay ningún almacén predeterminado. Marca uno en Configuraciones > Almacenes."
    );
  }

  if (data.length > 1) {
    return entityOperationError(
      "Hay más de un almacén predeterminado. Deja solo uno marcado."
    );
  }

  const warehouse = data[0];

  return entityOperationOk({
    id: String(warehouse.id ?? ""),
    code: String(warehouse.code ?? "").trim().toUpperCase(),
    description: String(warehouse.description ?? "").trim(),
    isDefault: true,
  });
}

export async function createInventoryAdjustmentAction(
  input: CreateInventoryAdjustmentInput
): Promise<EntityOperationResult<{ id: string }>> {
  const itemId = input.itemId.trim();
  const postingDate = input.postingDate.trim();
  const entryType = input.entryType.trim();
  const documentNo = "AJUSTE";
  const comment = input.comment?.trim() ?? "";
  const warehouseId = input.warehouseId.trim();
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

  if (!warehouseId) {
    return entityOperationError("El almacén es obligatorio.");
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

  const defaultWarehouseResult = await readDefaultWarehouse({
    supabase,
    tenantId: tenant.id,
    companyId: activeCompany.id,
  });

  if (!defaultWarehouseResult.ok) {
    return defaultWarehouseResult;
  }

  const warehouseResult = await readWarehouse({
    supabase,
    tenantId: tenant.id,
    companyId: activeCompany.id,
    warehouseId,
  });

  if (!warehouseResult.ok) {
    return warehouseResult;
  }

  const warehouse = warehouseResult.data;

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
      warehouse_id: warehouse.id,
      warehouse_code: warehouse.code,
      warehouse_description: warehouse.description || null,
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
  revalidatePath("/reports/inventory-by-product");
  revalidatePath("/reports/inventory-by-warehouse");
  revalidatePath("/dashboard");

  return entityOperationOk({
    id: data.id,
  });
}

export async function createBulkInventoryAdjustmentAction(
  input: CreateBulkInventoryAdjustmentInput
): Promise<EntityOperationResult<{ count: number }>> {
  const comment = String(input.comment ?? "").trim();
  const originWarehouseId = String(input.originWarehouseId ?? "").trim();
  const destinationWarehouseId = String(
    input.destinationWarehouseId ?? ""
  ).trim();
  const lines = Array.isArray(input.lines) ? input.lines : [];

  if (!comment) {
    return entityOperationError("El comentario es obligatorio.");
  }

  if (!originWarehouseId) {
    return entityOperationError("El almacén origen es obligatorio.");
  }

  if (!destinationWarehouseId) {
    return entityOperationError("El almacén destino es obligatorio.");
  }

  if (lines.length === 0) {
    return entityOperationError("No hay artículos activos para ajustar.");
  }

  const usesSameWarehouseInput = originWarehouseId === destinationWarehouseId;
  const actualQuantityByItemId = new Map<string, number>();
  const sourceQuantityByItemId = new Map<string, number>();

  for (const line of lines) {
    const itemId = line.itemId.trim();
    const actualQuantityValue = String(line.actualQuantity ?? "").trim();
    const sourceQuantityValue = String(
      line.sourceQuantity ?? line.actualQuantity ?? ""
    ).trim();
    const normalizedActualQuantity = normalizeDecimalField(actualQuantityValue);
    const actualQuantity = Number(normalizedActualQuantity);
    const normalizedSourceQuantity = normalizeDecimalField(sourceQuantityValue);
    const sourceQuantity = Number(normalizedSourceQuantity);

    if (!itemId) {
      return entityOperationError("No se ha podido identificar un artículo.");
    }

    if (usesSameWarehouseInput && !actualQuantityValue) {
      continue;
    }

    if (!usesSameWarehouseInput) {
      if (!actualQuantityValue) {
        continue;
      }

      if (
        !normalizedActualQuantity ||
        !Number.isFinite(actualQuantity) ||
        actualQuantity < 0
      ) {
        return entityOperationError(
          "Las cantidades deben ser números mayores o iguales que cero."
        );
      }

      if (actualQuantity <= quantityDifferenceThreshold) {
        continue;
      }

      if (
        !sourceQuantityValue ||
        !normalizedSourceQuantity ||
        !Number.isFinite(sourceQuantity) ||
        sourceQuantity < 0
      ) {
        return entityOperationError(
          "Las cantidades deben ser números mayores o iguales que cero."
        );
      }

      actualQuantityByItemId.set(itemId, actualQuantity);
      sourceQuantityByItemId.set(itemId, sourceQuantity);
      continue;
    }

    if (
      !normalizedActualQuantity ||
      !Number.isFinite(actualQuantity) ||
      actualQuantity < 0 ||
      !normalizedSourceQuantity ||
      !Number.isFinite(sourceQuantity) ||
      sourceQuantity < 0
    ) {
      return entityOperationError(
        "Las cantidades deben ser números mayores o iguales que cero."
      );
    }

    actualQuantityByItemId.set(itemId, actualQuantity);
    sourceQuantityByItemId.set(itemId, sourceQuantity);
  }

  if (actualQuantityByItemId.size === 0) {
    return entityOperationError("No hay diferencias que ajustar.");
  }

  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError(
      "No hay una empresa activa. Selecciona una empresa para ajustar inventario."
    );
  }

  const defaultWarehouseResult = await readDefaultWarehouse({
    supabase,
    tenantId: tenant.id,
    companyId: activeCompany.id,
  });

  if (!defaultWarehouseResult.ok) {
    return defaultWarehouseResult;
  }

  const originWarehouseResult = await readWarehouse({
    supabase,
    tenantId: tenant.id,
    companyId: activeCompany.id,
    warehouseId: originWarehouseId,
  });

  if (!originWarehouseResult.ok) {
    return originWarehouseResult;
  }

  const destinationWarehouseResult = await readWarehouse({
    supabase,
    tenantId: tenant.id,
    companyId: activeCompany.id,
    warehouseId: destinationWarehouseId,
  });

  if (!destinationWarehouseResult.ok) {
    return destinationWarehouseResult;
  }

  const originWarehouse = originWarehouseResult.data;
  const destinationWarehouse = destinationWarehouseResult.data;
  const usesSameWarehouse = originWarehouse.id === destinationWarehouse.id;

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
    .eq("warehouse_id", originWarehouse.id)
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
  if (!usesSameWarehouse) {
    for (const item of items) {
      const itemId = String(item.id);
      const calculatedQuantity = calculatedQuantityByItemId.get(itemId) ?? 0;
      const sourceQuantity = sourceQuantityByItemId.get(itemId) ?? 0;

      if (sourceQuantity - calculatedQuantity > quantityDifferenceThreshold) {
        return entityOperationError(
          `La salida de ${String(
            item.code ?? ""
          )} no puede ser mayor que el inventario calculado en origen.`
        );
      }

    }
  }

  const movements = items.flatMap((item) => {
    const itemId = String(item.id);
    const calculatedQuantity = calculatedQuantityByItemId.get(itemId) ?? 0;
    const actualQuantity = actualQuantityByItemId.get(itemId);
    const sourceQuantity = sourceQuantityByItemId.get(itemId) ?? 0;
    const unitOfMeasure = unitByItemId.get(itemId) ?? "";

    if (actualQuantity === undefined) {
      return [];
    }

    if (!usesSameWarehouse) {
      const transferMovements = [];

      if (sourceQuantity > quantityDifferenceThreshold) {
        transferMovements.push({
          tenant_id: tenant.id,
          company_id: activeCompany.id,
          item_id: item.id,
          item_code: item.code,
          item_description: item.description,
          warehouse_id: originWarehouse.id,
          warehouse_code: originWarehouse.code,
          warehouse_description: originWarehouse.description || null,
          created_at: getPostingDateTime(postingDate),
          updated_at: now,
          entry_type: "out",
          document_no: "AJUSTE",
          comment,
          origin: "Ajuste",
          quantity: formatAdjustmentQuantity(sourceQuantity),
          unit_of_measure: unitOfMeasure,
        });
      }

      if (actualQuantity > quantityDifferenceThreshold) {
        transferMovements.push({
          tenant_id: tenant.id,
          company_id: activeCompany.id,
          item_id: item.id,
          item_code: item.code,
          item_description: item.description,
          warehouse_id: destinationWarehouse.id,
          warehouse_code: destinationWarehouse.code,
          warehouse_description: destinationWarehouse.description || null,
          created_at: getPostingDateTime(postingDate),
          updated_at: now,
          entry_type: "in",
          document_no: "AJUSTE",
          comment,
          origin: "Ajuste",
          quantity: formatAdjustmentQuantity(actualQuantity),
          unit_of_measure: unitOfMeasure,
        });
      }

      return transferMovements;
    }

    const difference = actualQuantity - calculatedQuantity;

    if (Math.abs(difference) <= quantityDifferenceThreshold) {
      return [];
    }

    return [
      {
        tenant_id: tenant.id,
        company_id: activeCompany.id,
        item_id: item.id,
        item_code: item.code,
        item_description: item.description,
        warehouse_id: destinationWarehouse.id,
        warehouse_code: destinationWarehouse.code,
        warehouse_description: destinationWarehouse.description || null,
        created_at: getPostingDateTime(postingDate),
        updated_at: now,
        entry_type: difference > 0 ? "in" : "out",
        document_no: "AJUSTE",
        comment,
        origin: "Ajuste",
        quantity: formatAdjustmentQuantity(Math.abs(difference)),
        unit_of_measure: unitOfMeasure,
      },
    ];
  });

  if (movements.length === 0) {
    return entityOperationError("No hay diferencias que ajustar.");
  }

  const { error } = await supabase.from("item_balance_entries").insert(movements);

  if (error) {
    return entityOperationError(error.message);
  }

  revalidatePath("/items");
  revalidatePath("/item-balance-entries");
  revalidatePath("/reports/inventory-by-product");
  revalidatePath("/reports/inventory-by-warehouse");
  revalidatePath("/dashboard");

  return entityOperationOk({
    count: movements.length,
  });
}
