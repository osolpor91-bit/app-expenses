import { parseDateRangeFilterValue } from "./dateRangeFilter";
import { applyAdvancedTextFilter } from "./filterHelpers";
import { getBooleanSearchParam, getSingleSearchParam } from "./textSearch";

export type EntityFilterDefinition = {
  paramName: string;
  column: string;
  labelKey: string;
  type: "text" | "boolean" | "dateRange";
  operator?: "ilike" | "eq";
};

type SearchParamsRecord = Record<string, string | string[] | undefined>;

export function getEntityFilterParamNames(
  filters: readonly EntityFilterDefinition[] = []
) {
  return ["search", ...filters.map((filter) => filter.paramName)];
}

export function getFilterValues(
  searchParams: SearchParamsRecord,
  paramNames: readonly string[]
) {
  return paramNames.reduce<Record<string, string>>((values, paramName) => {
    values[paramName] = getSingleSearchParam(searchParams[paramName]);
    return values;
  }, {});
}

export function applyDatabaseFilters<TQuery>(
  query: TQuery,
  searchParams: SearchParamsRecord,
  filters: readonly EntityFilterDefinition[]
): TQuery {
  let filteredQuery = query as any;

  filters.forEach((filter) => {
    const rawValue = getSingleSearchParam(searchParams[filter.paramName]);

    if (!rawValue.trim()) {
      return;
    }

    if (filter.type === "boolean") {
      const booleanValue = getBooleanSearchParam(rawValue);

      if (booleanValue !== null) {
        filteredQuery = filteredQuery.eq(filter.column, booleanValue);
      }

      return;
    }

    if (filter.type === "dateRange") {
      const dateRange = parseDateRangeFilterValue(rawValue);

      if (!dateRange) {
        return;
      }

      if (dateRange.from) {
        filteredQuery = filteredQuery.gte(filter.column, dateRange.from);
      }

      if (dateRange.to) {
        filteredQuery = filteredQuery.lte(filter.column, dateRange.to);
      }

      return;
    }

    filteredQuery = applyAdvancedTextFilter({
      query: filteredQuery,
      column: filter.column,
      rawValue,
      defaultOperator: filter.operator ?? "ilike",
    });
  });

  return filteredQuery as TQuery;
}