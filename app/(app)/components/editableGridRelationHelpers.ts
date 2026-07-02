import type { EditableGridRecord } from "./EditableEntityGrid";

export type EditableGridAutocompleteOption = {
  id: string;
  label: string;
};

type AutocompleteRelationParams<TRecord extends EditableGridRecord> = {
  row: TRecord;
  displayFieldName: string;
  options: readonly EditableGridAutocompleteOption[];
};

function getDisplayValue<TRecord extends EditableGridRecord>(
  row: TRecord,
  displayFieldName: string
) {
  return String(row[displayFieldName] ?? "").trim();
}

export function getAutocompleteLabels(
  options: readonly EditableGridAutocompleteOption[]
) {
  return options.map((option) => option.label);
}

export function findAutocompleteOptionByLabel(
  options: readonly EditableGridAutocompleteOption[],
  label: string | null | undefined
) {
  const normalizedLabel = String(label ?? "").trim();

  if (!normalizedLabel) {
    return null;
  }

  return options.find((option) => option.label === normalizedLabel) ?? null;
}

export function getAutocompletePayloadId<TRecord extends EditableGridRecord>({
  row,
  displayFieldName,
  options,
}: AutocompleteRelationParams<TRecord>) {
  const displayValue = getDisplayValue(row, displayFieldName);
  const selectedOption = findAutocompleteOptionByLabel(options, displayValue);

  return selectedOption?.id ?? null;
}

export function hasValidAutocompleteValue<TRecord extends EditableGridRecord>({
  row,
  displayFieldName,
  options,
}: AutocompleteRelationParams<TRecord>) {
  return Boolean(
    getAutocompletePayloadId({
      row,
      displayFieldName,
      options,
    })
  );
}

export function hasInvalidAutocompleteValue<TRecord extends EditableGridRecord>({
  row,
  displayFieldName,
  options,
}: AutocompleteRelationParams<TRecord>) {
  const displayValue = getDisplayValue(row, displayFieldName);

  if (!displayValue) {
    return false;
  }

  return !findAutocompleteOptionByLabel(options, displayValue);
}