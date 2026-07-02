export type RelatedRecordValue = {
  code?: string | null;
  name?: string | null;
  slug?: string | null;
  [key: string]: unknown;
};

export type RelatedRecord = RelatedRecordValue | RelatedRecordValue[] | null;

export function getRelatedRecord(record: RelatedRecord) {
  return Array.isArray(record) ? record[0] ?? null : record;
}

export function getRelatedDisplayName(
  record: RelatedRecord,
  keys: string[],
  fallbackId?: string | null
) {
  const value = getRelatedRecord(record);

  if (!value) {
    return fallbackId || "-";
  }

  return (
    keys
      .map((key) => value[key])
      .filter(Boolean)
      .join(" - ") ||
    fallbackId ||
    "-"
  );
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function includesSearch(value: unknown, search: string) {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

export function matchesSearchValues(
  search: string,
  textValues: unknown[],
  uuidValues: Array<string | null | undefined> = []
) {
  const cleanSearch = search.trim();

  if (!cleanSearch) {
    return true;
  }

  const matchesText = textValues.some((value) =>
    includesSearch(value, cleanSearch)
  );

  if (matchesText) {
    return true;
  }

  if (!isUuid(cleanSearch)) {
    return false;
  }

  return uuidValues.some((value) => value === cleanSearch);
}