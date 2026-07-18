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
import { readWarehouseOptions } from "@/lib/warehouses/warehouseOptions";

import WarehouseReportFilter from "./WarehouseReportFilter";

type InventoryByProductPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
  created_at?: unknown;
  document_no?: unknown;
  comment?: unknown;
  origin?: unknown;
  entry_type?: unknown;
  quantity?: unknown;
  unit_of_measure?: unknown;
  warehouse_id?: unknown;
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

type InventoryByProductRow = {
  id: string;
  code: string;
  description: string;
  inventory: number;
  unitOfMeasure: string;
  movements: InventoryMovement[];
};

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

function buildInventoryRows({
  products,
  movements,
}: {
  products: ProductRecord[];
  movements: InventoryMovementRecord[];
}) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const movementsByItemId = new Map<string, InventoryMovement[]>();

  movements.forEach((movement, index) => {
    const itemId = getStringValue(movement.item_id);
    const product = productById.get(itemId);

    if (!product) {
      return;
    }

    const productBaseUnit = normalizeUnitOfMeasure(product.base_unit_of_measure);
    const movementUnit = normalizeUnitOfMeasure(movement.unit_of_measure);

    if (productBaseUnit && movementUnit !== productBaseUnit) {
      return;
    }

    const entryType = getStringValue(movement.entry_type);
    const quantity = getNumberValue(movement.quantity);
    const productMovements = movementsByItemId.get(itemId) ?? [];

    productMovements.push({
      id: getStringValue(movement.id) || `${itemId}-${index}`,
      date: getStringValue(movement.created_at),
      documentNo: getStringValue(movement.document_no),
      comment: getStringValue(movement.comment),
      origin: getStringValue(movement.origin),
      entryType,
      quantity,
      unitOfMeasure: movementUnit || productBaseUnit,
      signedQuantity: getSignedQuantity(entryType, quantity),
    });
    movementsByItemId.set(itemId, productMovements);
  });

  return products.map((product) => {
    const productMovements = movementsByItemId.get(product.id) ?? [];

    return {
      id: product.id,
      code: getStringValue(product.code),
      description: getStringValue(product.description),
      inventory: productMovements.reduce(
        (total, movement) => total + movement.signedQuantity,
        0
      ),
      unitOfMeasure: normalizeUnitOfMeasure(product.base_unit_of_measure),
      movements: productMovements,
    };
  });
}

function getModeHref({
  detail,
  warehouseId,
}: {
  detail: boolean;
  warehouseId: string;
}) {
  const query: Record<string, string> = {};

  if (detail) {
    query.detail = "true";
  }

  if (warehouseId) {
    query.warehouseId = warehouseId;
  }

  return detail
    ? {
        pathname: "/reports/inventory-by-product",
        query,
      }
    : warehouseId
      ? {
          pathname: "/reports/inventory-by-product",
          query,
        }
      : "/reports/inventory-by-product";
}

export default async function InventoryByProductPage({
  searchParams,
}: InventoryByProductPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const detailValue = getSingleSearchParam(resolvedSearchParams.detail);
  const showDetail = detailValue === "true" || detailValue === "1";
  const requestedWarehouseId = getSingleSearchParam(
    resolvedSearchParams.warehouseId
  );
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let rows: InventoryByProductRow[] = [];
  let warehouseOptions: Awaited<ReturnType<typeof readWarehouseOptions>> = [];
  let selectedWarehouseId = "";

  if (activeCompany) {
    warehouseOptions = await readWarehouseOptions({
      supabase,
      context: {
        tenantId: tenant.id,
        companyId: activeCompany.id,
      },
    });
    selectedWarehouseId = warehouseOptions.some(
      (warehouse) => warehouse.id === requestedWarehouseId
    )
      ? requestedWarehouseId
      : "";

    const { data: products, error: productsError } = await supabase
      .from("items")
      .select("id, code, description, base_unit_of_measure")
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .eq("is_active", true)
      .in("item_type", ["product", "Producto"])
      .order("code", { ascending: true });

    if (productsError) {
      throw new Error(
        `${dict.reports.inventoryByProductReadError}: ${productsError.message}`
      );
    }

    const productRecords = (products ?? []) as ProductRecord[];
    const productIds = productRecords.map((product) => product.id);
    let movements: InventoryMovementRecord[] = [];

    if (productIds.length > 0) {
      let movementQuery = supabase
        .from("item_balance_entries")
        .select(
          "id, item_id, warehouse_id, created_at, document_no, comment, origin, entry_type, quantity, unit_of_measure"
        )
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .in("item_id", productIds);

      if (selectedWarehouseId) {
        movementQuery = movementQuery.eq("warehouse_id", selectedWarehouseId);
      }

      const { data: movementRecords, error: movementsError } =
        await movementQuery.order("created_at", { ascending: false });

      if (movementsError) {
        throw new Error(
          `${dict.reports.inventoryByProductReadError}: ${movementsError.message}`
        );
      }

      movements = (movementRecords ?? []) as InventoryMovementRecord[];
    }

    rows = buildInventoryRows({
      products: productRecords,
      movements,
    });
  }

  const totalInventory = rows.reduce((total, row) => total + row.inventory, 0);

  return (
    <section className="max-w-[770px] space-y-4">
      <div className="space-y-1">
        <Link href="/reports" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToReports}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {dict.reports.inventoryByProduct}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-app-border bg-app-soft p-1 text-xs font-semibold">
          <Link
            href={getModeHref({
              detail: false,
              warehouseId: selectedWarehouseId,
            })}
            className={`rounded-md px-3 py-1.5 transition ${
              showDetail
                ? "text-app-muted hover:bg-app hover:text-primary-app"
                : "bg-primary-app text-white"
            }`}
          >
            {dict.reports.summaryView}
          </Link>
          <Link
            href={getModeHref({
              detail: true,
              warehouseId: selectedWarehouseId,
            })}
            className={`rounded-md px-3 py-1.5 transition ${
              showDetail
                ? "bg-primary-app text-white"
                : "text-app-muted hover:bg-app hover:text-primary-app"
            }`}
          >
            {dict.reports.detailView}
          </Link>
        </div>

        <WarehouseReportFilter
          warehouses={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          showDetail={showDetail}
          labels={{
            warehouse: dict.reports.warehouse,
            allWarehouses: dict.reports.allWarehouses,
          }}
        />
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.reports.noActiveCompanyDescription}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.reports.emptyInventoryByProduct}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex max-w-[720px] items-center justify-between gap-3 border-b border-app-border pb-1.5 text-xs font-semibold text-primary-app sm:text-sm">
            <span>{dict.reports.totalInventory}</span>
            <span className="whitespace-nowrap tabular-nums">
              {formatDecimalValue(totalInventory)}
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-app-border bg-app">
            <div className="grid grid-cols-[4.75rem_minmax(5.5rem,7rem)_minmax(0,1fr)_4rem_3.25rem] gap-1.5 border-b border-app-border bg-app-soft px-2 py-1.5 text-[10px] font-semibold uppercase text-app-muted sm:grid-cols-[7rem_16rem_minmax(0,1fr)_5rem_4.25rem] sm:gap-3 sm:px-3 sm:py-2 sm:text-xs">
              <span>{dict.items.code}</span>
              <span>{dict.items.description}</span>
              <span aria-hidden="true" />
              <span className="text-right">{dict.reports.inventoryQuantity}</span>
              <span className="text-right">{dict.reports.unit}</span>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {rows.map((row) => (
                <div key={row.id} className="px-2 py-1.5 sm:px-3 sm:py-2">
                  <div className="grid grid-cols-[4.75rem_minmax(5.5rem,7rem)_minmax(0,1fr)_4rem_3.25rem] items-start gap-1.5 text-xs sm:grid-cols-[7rem_16rem_minmax(0,1fr)_5rem_4.25rem] sm:gap-3 sm:text-sm">
                    <div className="break-words font-bold leading-tight text-primary-app">
                      {row.code || "-"}
                    </div>
                    <div className="break-words leading-tight text-app-muted sm:text-app">
                      {row.description || "-"}
                    </div>
                    <div aria-hidden="true" />
                    <div className="text-right font-semibold tabular-nums leading-tight text-app">
                      {formatDecimalValue(row.inventory)}
                    </div>
                    <div className="break-words text-right font-semibold leading-tight text-app">
                      {row.unitOfMeasure || "-"}
                    </div>
                  </div>

                  {showDetail ? (
                    <div className="mt-1.5 space-y-1 border-t border-app-border pt-1.5">
                      {row.movements.length === 0 ? (
                        <div className="text-xs text-app-muted">
                          {dict.reports.emptyInventoryMovements}
                        </div>
                      ) : (
                        row.movements.map((movement) => (
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
                              {movement.comment || movement.documentNo || "-"}
                            </span>
                            <span className="text-right font-semibold tabular-nums text-app">
                              {formatDecimalValue(movement.signedQuantity)}{" "}
                              {movement.unitOfMeasure}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
