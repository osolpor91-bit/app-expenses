"use client";

import { useRouter } from "next/navigation";

import type { WarehouseOption } from "@/lib/warehouses/warehouseOptions";

type WarehouseReportFilterProps = {
  warehouses: WarehouseOption[];
  selectedWarehouseId: string;
  showDetail: boolean;
  labels: {
    warehouse: string;
    allWarehouses: string;
  };
};

export default function WarehouseReportFilter({
  warehouses,
  selectedWarehouseId,
  showDetail,
  labels,
}: WarehouseReportFilterProps) {
  const router = useRouter();

  function changeWarehouse(nextWarehouseId: string) {
    const params = new URLSearchParams();

    if (showDetail) {
      params.set("detail", "true");
    }

    if (nextWarehouseId) {
      params.set("warehouseId", nextWarehouseId);
    }

    const queryString = params.toString();

    router.push(
      queryString
        ? `/reports/inventory-by-product?${queryString}`
        : "/reports/inventory-by-product"
    );
  }

  return (
    <label className="flex items-center gap-1 text-xs font-semibold text-app">
      <span className="sr-only">{labels.warehouse}</span>
      <select
        value={selectedWarehouseId}
        onChange={(event) => changeWarehouse(event.target.value)}
        className="input-app h-8 min-w-[10rem] px-2 py-1 text-xs"
      >
        <option value="">{labels.allWarehouses}</option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.label}
          </option>
        ))}
      </select>
    </label>
  );
}
