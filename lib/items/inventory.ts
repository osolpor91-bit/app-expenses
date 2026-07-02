import type { EntityRecord } from "@/lib/entities/core/entityDefinition";
import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";

const nonZeroInventoryThreshold = 0.000000001;

function getRecordStringValue(record: Record<string, unknown>, key: string) {
  return String(record[key] ?? "").trim();
}

export function normalizeUnitOfMeasure(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function getSignedInventoryQuantity(entry: Record<string, unknown>) {
  const quantity = Number(entry.quantity ?? 0);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return entry.entry_type === "out" ? -quantity : quantity;
}

export function hasNonZeroInventory(value: unknown) {
  const inventory = Number(value ?? 0);

  return Number.isFinite(inventory)
    ? Math.abs(inventory) > nonZeroInventoryThreshold
    : false;
}

export async function readItemBaseUnitInventory({
  supabase,
  context,
  itemId,
  baseUnitOfMeasure,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  itemId: string;
  baseUnitOfMeasure: string;
}) {
  if (!context.companyId || !itemId || !baseUnitOfMeasure) {
    return 0;
  }

  const normalizedBaseUnitOfMeasure = normalizeUnitOfMeasure(baseUnitOfMeasure);

  const { data, error } = await supabase
    .from("item_balance_entries")
    .select("entry_type, quantity, unit_of_measure")
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId)
    .eq("item_id", itemId)
    .eq("unit_of_measure", normalizedBaseUnitOfMeasure);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((inventory, entry) => {
    if (
      normalizeUnitOfMeasure(entry.unit_of_measure) !==
      normalizedBaseUnitOfMeasure
    ) {
      return inventory;
    }

    return inventory + getSignedInventoryQuantity(entry);
  }, 0);
}

export async function applyBaseUnitInventoryToItems({
  records,
  supabase,
  context,
}: {
  records: EntityRecord[];
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
}) {
  if (records.length === 0 || !context.companyId) {
    return records;
  }

  const itemIds = records
    .map((record) => getRecordStringValue(record, "id"))
    .filter(Boolean);
  const baseUnits = Array.from(
    new Set(
      records
        .map((record) => normalizeUnitOfMeasure(record.base_unit_of_measure))
        .filter(Boolean)
    )
  );

  if (itemIds.length === 0 || baseUnits.length === 0) {
    return records.map((record) => ({
      ...record,
      inventory: 0,
    }));
  }

  const { data, error } = await supabase
    .from("item_balance_entries")
    .select("item_id, entry_type, quantity, unit_of_measure")
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId)
    .in("item_id", itemIds)
    .in("unit_of_measure", baseUnits);

  if (error) {
    throw new Error(error.message);
  }

  const baseUnitByItemId = new Map(
    records.map((record) => [
      getRecordStringValue(record, "id"),
      normalizeUnitOfMeasure(record.base_unit_of_measure),
    ])
  );
  const inventoryByItemId = new Map<string, number>();

  (data ?? []).forEach((entry) => {
    const itemId = getRecordStringValue(entry, "item_id");
    const baseUnit = baseUnitByItemId.get(itemId);

    if (!baseUnit || normalizeUnitOfMeasure(entry.unit_of_measure) !== baseUnit) {
      return;
    }

    inventoryByItemId.set(
      itemId,
      (inventoryByItemId.get(itemId) ?? 0) + getSignedInventoryQuantity(entry)
    );
  });

  return records.map((record) => ({
    ...record,
    inventory: inventoryByItemId.get(getRecordStringValue(record, "id")) ?? 0,
  }));
}
