import type {
  EntityRecord,
} from "@/lib/entities/core/entityDefinition";
import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import { normalizeUnitOfMeasure } from "@/lib/items/inventory";

export type WarehouseOption = {
  id: string;
  code: string;
  description: string;
  isDefault: boolean;
  label: string;
};

export type ItemWarehouseInventoryMap = Record<string, Record<string, number>>;

function getStringValue(value: unknown) {
  return String(value ?? "").trim();
}

function getSignedInventoryQuantity(entry: Record<string, unknown>) {
  const quantity = Number(entry.quantity ?? 0);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return entry.entry_type === "out" ? -quantity : quantity;
}

export async function readWarehouseOptions({
  supabase,
  context,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
}) {
  if (!context.companyId) {
    return [];
  }

  const { data, error } = await supabase
    .from("warehouses")
    .select("id, code, description, is_default")
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId)
    .order("code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map<WarehouseOption>((warehouse) => {
    const code = getStringValue(warehouse.code).toUpperCase();
    const description = getStringValue(warehouse.description);

    return {
      id: getStringValue(warehouse.id),
      code,
      description,
      isDefault: Boolean(warehouse.is_default),
      label: code || "-",
    };
  });
}

export function getDefaultWarehouseId(warehouses: WarehouseOption[]) {
  return warehouses.find((warehouse) => warehouse.isDefault)?.id ?? "";
}

export async function readWarehouseInventoryByItem({
  supabase,
  context,
  records,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  records: EntityRecord[];
}): Promise<ItemWarehouseInventoryMap> {
  if (!context.companyId || records.length === 0) {
    return {};
  }

  const itemIds = records
    .map((record) => getStringValue(record.id))
    .filter(Boolean);
  const baseUnits = Array.from(
    new Set(
      records
        .map((record) => normalizeUnitOfMeasure(record.base_unit_of_measure))
        .filter(Boolean)
    )
  );

  if (itemIds.length === 0 || baseUnits.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("item_balance_entries")
    .select("item_id, warehouse_id, entry_type, quantity, unit_of_measure")
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId)
    .in("item_id", itemIds)
    .in("unit_of_measure", baseUnits);

  if (error) {
    throw new Error(error.message);
  }

  const baseUnitByItemId = new Map(
    records.map((record) => [
      getStringValue(record.id),
      normalizeUnitOfMeasure(record.base_unit_of_measure),
    ])
  );
  const inventoryByItemId: ItemWarehouseInventoryMap = {};

  (data ?? []).forEach((entry) => {
    const itemId = getStringValue(entry.item_id);
    const warehouseId = getStringValue(entry.warehouse_id);
    const baseUnit = baseUnitByItemId.get(itemId);

    if (
      !itemId ||
      !warehouseId ||
      !baseUnit ||
      normalizeUnitOfMeasure(entry.unit_of_measure) !== baseUnit
    ) {
      return;
    }

    inventoryByItemId[itemId] = inventoryByItemId[itemId] ?? {};
    inventoryByItemId[itemId][warehouseId] =
      (inventoryByItemId[itemId][warehouseId] ?? 0) +
      getSignedInventoryQuantity(entry);
  });

  return inventoryByItemId;
}
