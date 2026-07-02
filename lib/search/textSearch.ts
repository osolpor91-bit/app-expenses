export function getSingleSearchParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function sanitizeSearchText(search: string) {
  return search
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ");
}

function buildSearchPattern(search: string) {
  const cleanSearch = sanitizeSearchText(search);

  if (!cleanSearch) {
    return "";
  }

  if (cleanSearch.includes("*")) {
    return cleanSearch.replace(/\*/g, "%");
  }

  return `%${cleanSearch}%`;
}

export function buildTextSearchFilter(
  search: string,
  columns: readonly string[]
) {
  const searchPattern = buildSearchPattern(search);

  if (!searchPattern || columns.length === 0) {
    return null;
  }

  return columns
    .map((column) => `${column}.ilike.${searchPattern}`)
    .join(",");
}

export function getBooleanSearchParam(value?: string | string[]) {
  const rawValue = getSingleSearchParam(value).trim().toLowerCase();

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  return null;
}