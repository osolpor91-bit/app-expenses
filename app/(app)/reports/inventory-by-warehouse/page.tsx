export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import {
  formatDateValue,
  formatDecimalValue,
} from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";
import { getSingleSearchParam } from "@/lib/search/textSearch";

type InventoryByWarehousePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type WarehouseRecord = {
  id: string;
  code?: unknown;
  description?: unknown;
};

type ProductRecord = {
  id: string;
  code?: unknown;
  description?: unknown;
  base_unit_of_measure?: unknown;
};

type InventoryMovementRecord = {
  id?: unknown;
  item_id?: unknown;
  warehouse_id?: unknown;
  created_at?: unknown;
  document_no?: unknown;
  comment?: unknown;
  origin?: unknown;
  entry_type?: unknown;
  quantity?: unknown;
  unit_of_measure?: unknown;
};

type InventoryMovement = {
  id: string;
  date: string;
  documentNo: string;
  comment: string;
  origin: string;
  entryType: string;
  quantity: number;
  unitOfMeasure: string;
  signedQuantity: number;
};

type InventoryByWarehouseProductRow = {
  id: string;
  code: string;
  description: string;
  inventory: number;
  unitOfMeasure: string;
  movements: InventoryMovement[];
};

type InventoryByWarehouseGroup = {
  id: string;
  code: string;
  description: string;
  inventory: number;
  rows: InventoryByWarehouseProductRow[];
};

const quantityDifferenceThreshold = 0.000001;

function getStringValue(value: unknown) {
  return String(value ?? "").trim();
}

function getNumberValue(value: unknown) {
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeUnitOfMeasure(value: unknown) {
  return getStringValue(value).toUpperCase();
}

function getSignedQuantity(entryType: unknown, quantity: unknown) {
  const quantityValue = getNumberValue(quantity);

  return entryType === "out" ? -quantityValue : quantityValue;
}

function getEntryTypeLabel(
  entryType: string,
  dict: Awaited<ReturnType<typeof getDictionary>>["dict"]
) {
  if (entryType === "in") {
    return dict.itemBalanceEntries.entryTypeIn;
  }

  if (entryType === "out") {
    return dict.itemBalanceEntries.entryTypeOut;
  }

  return entryType || "-";
}

function buildInventoryByWarehouseGroups({
  warehouses,
  products,
  movements,
}: {
  warehouses: WarehouseRecord[];
  products: ProductRecord[];
  movements: InventoryMovementRecord[];
}) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const movementsByWarehouseAndItem = new Map<
    string,
    Map<string, InventoryMovement[]>
  >();

  movements.forEach((movement, index) => {
    const warehouseId = getStringValue(movement.warehouse_id);
    const itemId = getStringValue(movement.item_id);
    const product = productById.get(itemId);

    if (!warehouseId || !product) {
      return;
    }

    const productBaseUnit = normalizeUnitOfMeasure(product.base_unit_of_measure);
    const movementUnit = normalizeUnitOfMeasure(movement.unit_of_measure);

    if (productBaseUnit && movementUnit !== productBaseUnit) {
      return;
    }

    const entryType = getStringValue(movement.entry_type);
    const quantity = getNumberValue(movement.quantity);
    const movementsByItem =
      movementsByWarehouseAndItem.get(warehouseId) ?? new Map();
    const itemMovements = movementsByItem.get(itemId) ?? [];

    itemMovements.push({
      id: getStringValue(movement.id) || `${warehouseId}-${itemId}-${index}`,
      date: getStringValue(movement.created_at),
      documentNo: getStringValue(movement.document_no),
      comment: getStringValue(movement.comment),
      origin: getStringValue(movement.origin),
      entryType,
      quantity,
      unitOfMeasure: movementUnit || productBaseUnit,
      signedQuantity: getSignedQuantity(entryType, quantity),
    });

    movementsByItem.set(itemId, itemMovements);
    movementsByWarehouseAndItem.set(warehouseId, movementsByItem);
  });

  return warehouses
    .map((warehouse) => {
      const movementsByItem =
        movementsByWarehouseAndItem.get(warehouse.id) ?? new Map();
      const rows = products
        .map((product) => {
          const itemMovements = movementsByItem.get(product.id) ?? [];
          const inventory = itemMovements.reduce(
            (total: number, movement: InventoryMovement) =>
              total + movement.signedQuantity,
            0
          );

          return {
            id: product.id,
            code: getStringValue(product.code),
            description: getStringValue(product.description),
            inventory,
            unitOfMeasure: normalizeUnitOfMeasure(product.base_unit_of_measure),
            movements: itemMovements,
          };
        })
        .filter(
          (row) => Math.abs(row.inventory) > quantityDifferenceThreshold
        )
        .sort((left, right) => left.code.localeCompare(right.code));

      return {
        id: warehouse.id,
        code: getStringValue(warehouse.code),
        description: getStringValue(warehouse.description),
        inventory: rows.reduce((total, row) => total + row.inventory, 0),
        rows,
      };
    })
    .filter((group) => group.rows.length > 0)
    .sort((left, right) => left.code.localeCompare(right.code));
}

function getModeHref({ detail }: { detail: boolean }) {
  return detail
    ? {
        pathname: "/reports/inventory-by-warehouse",
        query: {
          detail: "true",
        },
      }
    : "/reports/inventory-by-warehouse";
}

export default async function InventoryByWarehousePage({
  searchParams,
}: InventoryByWarehousePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const detailValue = getSingleSearchParam(resolvedSearchParams.detail);
  const showDetail = detailValue === "true" || detailValue === "1";
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let groups: InventoryByWarehouseGroup[] = [];

  if (activeCompany) {
    const [warehousesResult, productsResult] = await Promise.all([
      supabase
        .from("warehouses")
        .select("id, code, description")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .order("code", { ascending: true }),
      supabase
        .from("items")
        .select("id, code, description, base_unit_of_measure")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .eq("is_active", true)
        .in("item_type", ["product", "Producto"])
        .order("code", { ascending: true }),
    ]);

    if (warehousesResult.error) {
      throw new Error(
        `${dict.reports.inventoryByWarehouseReadError}: ${warehousesResult.error.message}`
      );
    }

    if (productsResult.error) {
      throw new Error(
        `${dict.reports.inventoryByWarehouseReadError}: ${productsResult.error.message}`
      );
    }

    const warehouses = (warehousesResult.data ?? []) as WarehouseRecord[];
    const products = (productsResult.data ?? []) as ProductRecord[];
    const productIds = products.map((product) => product.id);
    const warehouseIds = warehouses.map((warehouse) => warehouse.id);
    let movements: InventoryMovementRecord[] = [];

    if (productIds.length > 0 && warehouseIds.length > 0) {
      const { data: movementRecords, error: movementsError } = await supabase
        .from("item_balance_entries")
        .select(
          "id, item_id, warehouse_id, created_at, document_no, comment, origin, entry_type, quantity, unit_of_measure"
        )
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .in("item_id", productIds)
        .in("warehouse_id", warehouseIds)
        .order("created_at", { ascending: false });

      if (movementsError) {
        throw new Error(
          `${dict.reports.inventoryByWarehouseReadError}: ${movementsError.message}`
        );
      }

      movements = (movementRecords ?? []) as InventoryMovementRecord[];
    }

    groups = buildInventoryByWarehouseGroups({
      warehouses,
      products,
      movements,
    });
  }

  const totalInventory = groups.reduce(
    (total, group) => total + group.inventory,
    0
  );

  return (
    <section className="max-w-[820px] space-y-4">
      <div className="space-y-1">
        <Link href="/reports" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToReports}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {dict.reports.inventoryByWarehouse}
        </h1>
      </div>

      <div className="inline-flex rounded-lg border border-app-border bg-app-soft p-1 text-xs font-semibold">
        <Link
          href={getModeHref({ detail: false })}
          className={`rounded-md px-3 py-1.5 transition ${
            showDetail
              ? "text-app-muted hover:bg-app hover:text-primary-app"
              : "bg-primary-app text-white"
          }`}
        >
          {dict.reports.summaryView}
        </Link>
        <Link
          href={getModeHref({ detail: true })}
          className={`rounded-md px-3 py-1.5 transition ${
            showDetail
              ? "bg-primary-app text-white"
              : "text-app-muted hover:bg-app hover:text-primary-app"
          }`}
        >
          {dict.reports.detailView}
        </Link>
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.reports.noActiveCompanyDescription}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.reports.emptyInventoryByWarehouse}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex max-w-[720px] items-center justify-between gap-3 border-b border-app-border pb-1.5 text-xs font-semibold text-primary-app sm:text-sm">
            <span>{dict.reports.totalInventory}</span>
            <span className="whitespace-nowrap tabular-nums">
              {formatDecimalValue(totalInventory)}
            </span>
          </div>

          <div className="space-y-3">
            {groups.map((group) => (
              <section
                key={group.id}
                className="overflow-hidden rounded-lg border border-app-border bg-app"
              >
                <div className="flex items-start justify-between gap-3 border-b border-app-border bg-app-soft px-2 py-2 sm:px-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-bold uppercase leading-tight text-primary-app">
                      {group.code || "-"}
                    </h2>
                    {group.description ? (
                      <p className="break-words text-xs leading-tight text-app-muted">
                        {group.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm font-bold tabular-nums text-primary-app">
                    {formatDecimalValue(group.inventory)}
                  </div>
                </div>

                <div className="grid grid-cols-[4.75rem_minmax(5.75rem,8rem)_4.25rem_3.25rem] gap-1.5 border-b border-app-border bg-app-soft px-2 py-1.5 text-[10px] font-semibold uppercase text-app-muted sm:grid-cols-[8rem_18rem_5.5rem_4.5rem] sm:gap-3 sm:px-3 sm:py-2 sm:text-xs">
                  <span>{dict.items.code}</span>
                  <span>{dict.items.description}</span>
                  <span className="text-right">
                    {dict.reports.inventoryQuantity}
                  </span>
                  <span className="text-right">{dict.reports.unit}</span>
                </div>

                <div className="divide-y divide-[var(--color-border)]">
                  {group.rows.map((row) => (
                    <div key={row.id} className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <div className="grid grid-cols-[4.75rem_minmax(5.75rem,8rem)_4.25rem_3.25rem] items-start gap-1.5 text-xs sm:grid-cols-[8rem_18rem_5.5rem_4.5rem] sm:gap-3 sm:text-sm">
                        <div className="break-words font-bold leading-tight text-primary-app">
                          {row.code || "-"}
                        </div>
                        <div className="break-words leading-tight text-app-muted sm:text-app">
                          {row.description || "-"}
                        </div>
                        <div className="text-right font-semibold tabular-nums leading-tight text-app">
                          {formatDecimalValue(row.inventory)}
                        </div>
                        <div className="break-words text-right font-semibold leading-tight text-app">
                          {row.unitOfMeasure || "-"}
                        </div>
                      </div>

                      {showDetail ? (
                        <div className="mt-1.5 space-y-1 border-t border-app-border pt-1.5">
                          {row.movements.map((movement) => (
                            <div
                              key={movement.id}
                              className="grid grid-cols-[4.25rem_3.25rem_minmax(0,1fr)_4.75rem] gap-1 rounded-md bg-app-soft px-2 py-1 text-[11px] text-app-muted sm:grid-cols-[5rem_5rem_5rem_1fr_6rem] sm:items-center sm:gap-2 sm:text-xs"
                            >
                              <span>{formatDateValue(movement.date)}</span>
                              <span>
                                {getEntryTypeLabel(movement.entryType, dict)}
                              </span>
                              <span className="hidden sm:block">
                                {movement.origin || "-"}
                              </span>
                              <span className="break-words">
                                {movement.comment ||
                                  movement.documentNo ||
                                  "-"}
                              </span>
                              <span className="text-right font-semibold tabular-nums text-app">
                                {formatDecimalValue(movement.signedQuantity)}{" "}
                                {movement.unitOfMeasure}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
