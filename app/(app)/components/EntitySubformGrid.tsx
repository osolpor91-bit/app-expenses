"use client";

import { useRouter } from "next/navigation";
import {
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

import {
  getEditableFields,
  getFieldOptionLabel,
} from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type {
  EntityRecord,
  EntitySubformDefinition,
} from "@/lib/entities/core/entityDefinition";
import { buildFieldValidators } from "@/lib/validation/fieldValidationRegistry";

import {
  createDraftFromRecord,
  createEmptyDraft,
  getFieldLabel,
  getGridFields,
  getInputMode,
  getSubformAlignmentClassName,
  getSubformColumnClassName,
  getSubformInputClassName,
  hasAnyEditableValue,
  hasValuesUntilFieldIndex,
} from "./EntitySubformGrid.helpers";

import {
  createEntitySubformRecordAction,
  deleteEntitySubformRecordsAction,
  updateEntitySubformFieldAction,
} from "../actions/entityActions";

import type {
  EntityRelationOption,
  EntityRelationOptionsByField,
} from "@/lib/entities/core/entityRelations";
import type { PurchaseLineSourceOptionsByType } from "@/lib/purchaseLines/purchaseLineLookups";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import AutocompleteInput from "./AutocompleteInput";

type EntitySubformGridLabels = {
  title: string;
  actions: string;
  addLine: string;
  deleteLine: string;
  deleteSelectedLine: string;
  deleteAllLines: string;
  selectLineToDelete: string;
  confirmDeleteAll: string;
  recordsDeleted: string;
  empty: string;
  saving: string;
  saveError: string;
  deleteError: string;
  recordSaved: string;
  confirmDelete: string;
  fieldRequired: string;
  validationMessages: Record<string, unknown>;
};

type EntitySubformGridProps = {
  entityKey: string;
  subform: EntitySubformDefinition;
  parentId: string;
  initialRecords: EntityRecord[];
  fieldLabels: Record<string, string>;
  visibleGridFieldKeys?: string[];
  relationOptionsByField?: EntityRelationOptionsByField;
  purchaseLineSourceOptionsByType?: PurchaseLineSourceOptionsByType | null;
  activeCompanyPurchaseDefaultLineType?: string | null;
  labels: EntitySubformGridLabels;
};

function getVisibleGridFields({
  subform,
  visibleGridFieldKeys,
}: {
  subform: EntitySubformDefinition;
  visibleGridFieldKeys?: string[];
}) {
  const baseFields = getGridFields(subform);

  if (!visibleGridFieldKeys) {
    return baseFields;
  }

  const visibleFieldKeys = new Set(visibleGridFieldKeys);

  return baseFields.filter((field) => {
    if (visibleFieldKeys.has(field.key)) {
      return true;
    }

    // Evitamos romper la creación de líneas si un campo obligatorio
    // se oculta por personalización.
    if (field.required) {
      return true;
    }

    return false;
  });
}

export default function EntitySubformGrid({
  entityKey,
  subform,
  parentId,
  initialRecords,
  fieldLabels,
  visibleGridFieldKeys,
  labels,
  relationOptionsByField = {},
  purchaseLineSourceOptionsByType = null,
  activeCompanyPurchaseDefaultLineType = null,
}: EntitySubformGridProps) {
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const gridRef = useRef<HTMLDivElement | null>(null);
  const skipBlurSaveRef = useRef<string | null>(null);
  const skipNewRowBlurRef = useRef(false);

  const fields = useMemo(
    () =>
      getVisibleGridFields({
        subform,
        visibleGridFieldKeys,
      }),
    [subform, visibleGridFieldKeys]
  );
  const editableFields = useMemo(() => getEditableFields(fields), [fields]);

  const lastEditableFieldIndex = useMemo(() => {
    for (let index = fields.length - 1; index >= 0; index -= 1) {
      if (fields[index]?.editable !== false) {
        return index;
      }
    }

    return fields.length - 1;
  }, [fields]);

  const quickCreateFieldIndex = useMemo(() => {
    if (!subform.quickCreateOnTabFieldDbName) {
      return -1;
    }

    return fields.findIndex(
      (field) => field.dbName === subform.quickCreateOnTabFieldDbName
    );
  }, [fields, subform.quickCreateOnTabFieldDbName]);

  const fieldValidators = useMemo(
    () => buildFieldValidators(fields, labels.validationMessages),
    [fields, labels.validationMessages]
  );

  const [records, setRecords] = useState<EntityRecord[]>(initialRecords);

  const [draftsById, setDraftsById] = useState<
    Record<string, Record<string, string>>
  >(() =>
    initialRecords.reduce<Record<string, Record<string, string>>>(
      (drafts, record) => {
        drafts[record.id] = createDraftFromRecord(fields, record);
        return drafts;
      },
      {}
    )
  );

  const [newDraft, setNewDraft] = useState<Record<string, string>>(() =>
    createNewDraft()
  );

  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {}
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const selectedRecordIndex = records.findIndex(
    (record) => record.id === selectedRecordId
  );

  const selectedRecord =
    selectedRecordIndex >= 0 ? records[selectedRecordIndex] : null;

  function focusCell(rowIndex: number, fieldIndex: number) {
    window.setTimeout(() => {
      const input = gridRef.current?.querySelector<
        HTMLInputElement | HTMLSelectElement
      >(
        `input[data-subform-row="${rowIndex}"][data-subform-field="${fieldIndex}"], select[data-subform-row="${rowIndex}"][data-subform-field="${fieldIndex}"]`
      );

      input?.focus();

      if (input instanceof HTMLInputElement) {
        input.select();
      }
    }, 0);
  }

  function getRequiredFieldMessage(field: EntityFieldDefinition) {
    return labels.fieldRequired.replace(
      "{field}",
      getFieldLabel(fieldLabels, field)
    );
  }

  function validateField(field: EntityFieldDefinition, rawValue: string) {
    const validator = fieldValidators[field.dbName];

    if (!validator) {
      return {
        value: rawValue.trim(),
        error: null,
      };
    }

    const result = validator(rawValue);

    return {
      value:
        result.value === null || result.value === undefined
          ? ""
          : String(result.value),
      error: result.error,
    };
  }

  function isPurchaseLineSubform() {
    return subform.table === "purchases_line";
  }

  function getDefaultPurchaseLineType(value: unknown) {
    return value === "account" ? "account" : "item";
  }

  function createNewDraft() {
    const draft = createEmptyDraft(fields);

    if (isPurchaseLineSubform()) {
      draft.line_type = getDefaultPurchaseLineType(
        activeCompanyPurchaseDefaultLineType ?? draft.line_type
      );
    }

    return draft;
  }

  function getPurchaseLineSourceOptions(draft: Record<string, string>) {
    if (!purchaseLineSourceOptionsByType) {
      return [];
    }

    const lineType = getDefaultPurchaseLineType(draft.line_type);

    return purchaseLineSourceOptionsByType[lineType] ?? [];
  }

  function isAutocompleteField(field: EntityFieldDefinition) {
    return field.type === "select";
  }

  function getAutocompleteOptions({
    field,
    draft,
  }: {
    field: EntityFieldDefinition;
    draft: Record<string, string>;
  }) {
    return getSelectOptions({ field, draft }).map((option) => {
      const code =
        getStringOptionValue(option, "code") || String(option.label ?? "").trim();

      const description = getStringOptionValue(option, "description");

      const menuLabel = [code, description].filter(Boolean).join(" - ");
      const searchLabel = [code, description].filter(Boolean).join(" ");

      return {
        value: option.id,
        label: code || option.label,
        menuLabel: menuLabel || option.label,
        searchLabel: searchLabel || option.label,
      };
    });
  }

  function getCurrentReturnToPath() {
    const queryString = searchParams.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  function addReturnToToHref(href: string) {
    const [path = "", rawQueryString = ""] = href.split("?");
    const params = new URLSearchParams(rawQueryString);

    params.set("returnTo", getCurrentReturnToPath());

    const queryString = params.toString();

    return queryString ? `${path}?${queryString}` : path;
  }

  function getPurchaseLineSourceHref(draft: Record<string, string>) {
    if (!isPurchaseLineSubform()) {
      return null;
    }

    const sourceId = String(draft.line_source_id ?? "").trim();

    if (!sourceId) {
      return null;
    }

    const lineType = getDefaultPurchaseLineType(draft.line_type);

    if (lineType === "account") {
      return addReturnToToHref(`/chart-of-accounts/${sourceId}`);
    }

    return addReturnToToHref(`/items/${sourceId}`);
  }

  function shouldShowPurchaseLineSourceLink(field: EntityFieldDefinition) {
    return isPurchaseLineSubform() && field.dbName === "line_source_id";
  }

  function getSelectOptions({
    field,
    draft,
  }: {
    field: EntityFieldDefinition;
    draft: Record<string, string>;
  }) {
    if (field.type === "option") {
      return (
        field.options?.map((option) => ({
          id: option.value,
          label: getFieldOptionLabel({
            field,
            value: option.value,
            fieldLabels,
          }),
          values: {},
        })) ?? []
      );
    }

    if (field.dbName === "line_source_id" && isPurchaseLineSubform()) {
      return getPurchaseLineSourceOptions(draft);
    }

    return relationOptionsByField[field.dbName] ?? [];
  }

  function getStringOptionValue(
    option: EntityRelationOption | undefined,
    key: string
  ) {
    const value = option?.values?.[key];

    return value === null || value === undefined ? "" : String(value);
  }

  function shouldApplyPurchasePriceDefault(draft: Record<string, string>) {
    return (
      entityKey !== "portalSupplierInvoices" &&
      getDefaultPurchaseLineType(draft.line_type) === "item"
    );
  }

  function applyPurchaseLineSourceDefaults({
    draft,
    value,
  }: {
    draft: Record<string, string>;
    value: string;
  }) {
    const sourceOption = getPurchaseLineSourceOptions(draft).find(
      (option) => option.id === value
    );

    return {
      ...draft,
      line_source_id: value,
      description: getStringOptionValue(sourceOption, "description"),
      fiscal_treatment_id: getStringOptionValue(
        sourceOption,
        "fiscal_treatment_id"
      ),
      ...(shouldApplyPurchasePriceDefault(draft)
        ? {
          unit_price: getStringOptionValue(sourceOption, "purchase_price") || "0",
        }
        : {}),
    };
  }

  function getDraftAfterChange({
    draft,
    field,
    value,
  }: {
    draft: Record<string, string>;
    field: EntityFieldDefinition;
    value: string;
  }) {
    if (!isPurchaseLineSubform()) {
      return {
        ...draft,
        [field.dbName]: value,
      };
    }

    if (field.dbName === "line_type") {
      return {
        ...draft,
        line_type: getDefaultPurchaseLineType(value),
        line_source_id: "",
        description: "",
        fiscal_treatment_id: "",
        vat_rate: "",
        equivalence_surcharge_rate: "",
      };
    }

    if (field.dbName === "line_source_id") {
      return applyPurchaseLineSourceDefaults({
        draft: {
          ...draft,
          line_source_id: value,
        },
        value,
      });
    }

    if (field.dbName === "fiscal_treatment_id") {
      return {
        ...draft,
        fiscal_treatment_id: value,
        vat_rate: "",
        equivalence_surcharge_rate: "",
      };
    }

    return {
      ...draft,
      [field.dbName]: value,
    };
  }

  function getFieldError(rowKey: string, field: EntityFieldDefinition) {
    return fieldErrors[`${rowKey}:${field.dbName}`] ?? null;
  }

  function setFieldError({
    rowKey,
    field,
    error,
  }: {
    rowKey: string;
    field: EntityFieldDefinition;
    error: string;
  }) {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [`${rowKey}:${field.dbName}`]: error,
    }));

    setMessage(error);
  }

  function clearFieldError({
    rowKey,
    field,
  }: {
    rowKey: string;
    field: EntityFieldDefinition;
  }) {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [`${rowKey}:${field.dbName}`]: null,
    }));
  }

  function setDraftValue({
    id,
    field,
    value,
  }: {
    id: string;
    field: EntityFieldDefinition;
    value: string;
  }) {
    setDraftsById((currentDrafts) => ({
      ...currentDrafts,
      [id]: {
        ...(currentDrafts[id] ?? createEmptyDraft(fields)),
        [field.dbName]: value,
      },
    }));

    clearFieldError({
      rowKey: id,
      field,
    });
  }

  function setNewDraftValue(field: EntityFieldDefinition, value: string) {
    setNewDraft((currentDraft) =>
      getDraftAfterChange({
        draft: currentDraft,
        field,
        value,
      })
    );

    clearFieldError({
      rowKey: "new",
      field,
    });
  }

  async function saveExistingField({
    record,
    field,
    rawValue,
  }: {
    record: EntityRecord;
    field: EntityFieldDefinition;
    rawValue: string;
  }) {
    if (field.editable === false) {
      return true;
    }

    const rowKey = record.id;
    const validationResult = validateField(field, rawValue);

    if (validationResult.error) {
      setFieldError({
        rowKey,
        field,
        error: validationResult.error,
      });
      return false;
    }

    if (field.required && !validationResult.value) {
      setFieldError({
        rowKey,
        field,
        error: getRequiredFieldMessage(field),
      });
      return false;
    }

    const previousValidationResult = validateField(
      field,
      createDraftFromRecord(fields, record)[field.dbName] ?? ""
    );

    if (validationResult.value === previousValidationResult.value) {
      setDraftValue({
        id: record.id,
        field,
        value: validationResult.value,
      });
      return true;
    }

    const savingFieldKey = `${record.id}:${field.dbName}`;
    setSavingKey(savingFieldKey);
    setMessage(null);

    const result = await updateEntitySubformFieldAction({
      entityKey,
      subformKey: subform.key,
      parentId,
      id: record.id,
      fieldName: field.dbName,
      value: validationResult.value,
    });

    setSavingKey(null);

    if (!result.ok) {
      setFieldError({
        rowKey,
        field,
        error: `${labels.saveError}: ${result.error}`,
      });
      return false;
    }

    const updatedRecord = result.data.record as EntityRecord;

    setRecords((currentRecords) =>
      currentRecords.map((currentRecord) =>
        currentRecord.id === record.id ? updatedRecord : currentRecord
      )
    );

    setDraftsById((currentDrafts) => ({
      ...currentDrafts,
      [record.id]: createDraftFromRecord(fields, updatedRecord),
    }));

    setMessage(labels.recordSaved);
    router.refresh();

    return true;
  }

  async function saveExistingSelectField({
    record,
    field,
    value,
  }: {
    record: EntityRecord;
    field: EntityFieldDefinition;
    value: string;
  }) {
    const draft = draftsById[record.id] ?? createEmptyDraft(fields);

    setDraftsById((currentDrafts) => ({
      ...currentDrafts,
      [record.id]: getDraftAfterChange({
        draft,
        field,
        value,
      }),
    }));

    return saveExistingField({
      record,
      field,
      rawValue: value,
    });
  }

  async function createLineFromDraft({
    focusBlankRowAfterCreate = false,
    focusFieldIndex = 0,
    valuesOverride,
  }: {
    focusBlankRowAfterCreate?: boolean;
    focusFieldIndex?: number;
    valuesOverride?: Record<string, string>;
  } = {}) {
    if (savingKey === "new") {
      return false;
    }

    const draftToCreate = {
      ...newDraft,
      ...(valuesOverride ?? {}),
    };

    if (!hasAnyEditableValue(editableFields, draftToCreate)) {
      return false;
    }

    setMessage(null);

    const normalizedValues: Record<string, string> = {};

    for (const field of editableFields) {
      const rawValue = draftToCreate[field.dbName] ?? "";
      const validationResult = validateField(field, rawValue);

      if (validationResult.error) {
        setFieldError({
          rowKey: "new",
          field,
          error: validationResult.error,
        });
        return false;
      }

      if (field.required && !validationResult.value) {
        setFieldError({
          rowKey: "new",
          field,
          error: getRequiredFieldMessage(field),
        });
        return false;
      }

      normalizedValues[field.dbName] = validationResult.value;
    }

    const currentRecordsLength = records.length;

    setSavingKey("new");

    const result = await createEntitySubformRecordAction({
      entityKey,
      subformKey: subform.key,
      parentId,
      values: normalizedValues,
    });

    setSavingKey(null);

    if (!result.ok) {
      setMessage(`${labels.saveError}: ${result.error}`);
      return false;
    }

    const createdRecord = result.data.record as EntityRecord;

    setRecords((currentRecords) => [...currentRecords, createdRecord]);

    setDraftsById((currentDrafts) => ({
      ...currentDrafts,
      [createdRecord.id]: createDraftFromRecord(fields, createdRecord),
    }));

    setNewDraft(createNewDraft());

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      fields.forEach((field) => {
        delete nextErrors[`new:${field.dbName}`];
      });

      return nextErrors;
    });

    setMessage(labels.recordSaved);
    router.refresh();

    if (focusBlankRowAfterCreate) {
      focusCell(currentRecordsLength + 1, focusFieldIndex);
    }

    return true;
  }

  async function handleExistingInputBlur({
    record,
    field,
    rawValue,
  }: {
    record: EntityRecord;
    field: EntityFieldDefinition;
    rawValue: string;
  }) {
    const fieldKey = `${record.id}:${field.dbName}`;

    if (skipBlurSaveRef.current === fieldKey) {
      skipBlurSaveRef.current = null;
      return;
    }

    await saveExistingField({
      record,
      field,
      rawValue,
    });
  }

  async function handleExistingInputKeyDown({
    event,
    record,
    rowIndex,
    field,
    fieldIndex,
  }: {
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>;
    record: EntityRecord;
    rowIndex: number;
    field: EntityFieldDefinition;
    fieldIndex: number;
  }) {
    const fieldKey = `${record.id}:${field.dbName}`;

    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === "Delete" || event.key === "Backspace")
    ) {
      event.preventDefault();
      skipBlurSaveRef.current = fieldKey;

      const deleted = await deleteLine({
        record,
        rowIndex,
      });

      if (deleted) {
        const nextRowIndex = Math.min(rowIndex, Math.max(records.length - 1, 0));
        focusCell(nextRowIndex, fieldIndex);
      }

      return;
    }

    if (
      event.key !== "Enter" &&
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp"
    ) {
      return;
    }

    event.preventDefault();
    skipBlurSaveRef.current = fieldKey;

    const saved = await saveExistingField({
      record,
      field,
      rawValue: event.currentTarget.value,
    });

    if (!saved) {
      return;
    }

    if (event.key === "ArrowUp") {
      focusCell(Math.max(rowIndex - 1, 0), fieldIndex);
      return;
    }

    focusCell(rowIndex + 1, fieldIndex);
  }

  async function handleNewInputKeyDown({
    event,
    field,
    fieldIndex,
  }: {
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>;
    field: EntityFieldDefinition;
    fieldIndex: number;
  }) {
    const currentFieldOverride = {
      [field.dbName]: event.currentTarget.value,
    };

    const shouldCreateOnTab =
      fieldIndex === lastEditableFieldIndex ||
      fieldIndex === quickCreateFieldIndex;

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (hasAnyEditableValue(editableFields, newDraft)) {
        skipNewRowBlurRef.current = true;

        const created = await createLineFromDraft();

        if (created) {
          focusCell(Math.max(records.length - 1, 0), fieldIndex);
        }

        return;
      }

      focusCell(Math.max(records.length - 1, 0), fieldIndex);
      return;
    }

    if (event.key === "Enter" || event.key === "ArrowDown") {
      event.preventDefault();

      await createLineFromDraft({
        focusBlankRowAfterCreate: true,
        focusFieldIndex: fieldIndex,
        valuesOverride: currentFieldOverride,
      });

      return;
    }

    if (event.key === "Tab" && !event.shiftKey && shouldCreateOnTab) {
      if (!hasAnyEditableValue(editableFields, newDraft)) {
        return;
      }

      if (
        fieldIndex === quickCreateFieldIndex &&
        !hasValuesUntilFieldIndex({
          fields,
          values: newDraft,
          fieldIndex: quickCreateFieldIndex,
        })
      ) {
        return;
      }

      event.preventDefault();

      await createLineFromDraft({
        focusBlankRowAfterCreate: true,
        focusFieldIndex: 0,
        valuesOverride: currentFieldOverride,
      });
    }
  }

  async function handleNewRowBlur(event: FocusEvent<HTMLTableRowElement>) {
    if (skipNewRowBlurRef.current) {
      skipNewRowBlurRef.current = false;
      return;
    }

    const nextFocusedElement = event.relatedTarget;

    if (
      nextFocusedElement instanceof Node &&
      event.currentTarget.contains(nextFocusedElement)
    ) {
      return;
    }

    await createLineFromDraft();
  }

  async function deleteSelectedLine() {
    if (!selectedRecord) {
      setMessage(labels.selectLineToDelete);
      return;
    }

    await deleteLine({
      record: selectedRecord,
      rowIndex: selectedRecordIndex,
    });
  }

  async function deleteAllLines() {
    if (records.length === 0) {
      return;
    }

    if (!window.confirm(labels.confirmDeleteAll)) {
      return;
    }

    setMessage(null);
    setSavingKey("delete:all");

    const result = await deleteEntitySubformRecordsAction({
      entityKey,
      subformKey: subform.key,
      parentId,
      ids: records.map((record) => record.id),
    });

    setSavingKey(null);

    if (!result.ok) {
      setMessage(`${labels.deleteError}: ${result.error}`);
      return;
    }

    setRecords([]);
    setDraftsById({});
    setSelectedRecordId(null);

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      records.forEach((record) => {
        fields.forEach((field) => {
          delete nextErrors[`${record.id}:${field.dbName}`];
        });
      });

      return nextErrors;
    });

    setMessage(labels.recordsDeleted);
    router.refresh();

    window.setTimeout(() => {
      focusCell(0, 0);
    }, 0);
  }

  async function deleteLine({
    record,
    rowIndex,
  }: {
    record: EntityRecord;
    rowIndex: number;
  }) {
    if (!window.confirm(labels.confirmDelete)) {
      return false;
    }

    setMessage(null);
    setSavingKey(`delete:${record.id}`);

    const result = await deleteEntitySubformRecordsAction({
      entityKey,
      subformKey: subform.key,
      parentId,
      ids: [record.id],
    });

    setSavingKey(null);

    if (!result.ok) {
      setMessage(`${labels.deleteError}: ${result.error}`);
      return false;
    }

    const nextRecords = records.filter(
      (currentRecord) => currentRecord.id !== record.id
    );

    setRecords(nextRecords);

    setSelectedRecordId(
      nextRecords[Math.min(rowIndex, Math.max(nextRecords.length - 1, 0))]
        ?.id ?? null
    );

    setDraftsById((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[record.id];
      return nextDrafts;
    });

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      fields.forEach((field) => {
        delete nextErrors[`${record.id}:${field.dbName}`];
      });

      return nextErrors;
    });

    setMessage(labels.recordSaved);
    router.refresh();

    window.setTimeout(() => {
      const nextRowIndex =
        nextRecords.length > 0
          ? Math.min(rowIndex, nextRecords.length - 1)
          : 0;

      focusCell(nextRowIndex, 0);
    }, 0);

    return true;
  }

  return (
    <section className="card-app min-w-0 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-base font-semibold text-primary-app">
            {labels.title}
          </h2>

          <button
            type="button"
            className="btn-secondary-app h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedRecord || Boolean(savingKey)}
            onClick={() => void deleteSelectedLine()}
          >
            {labels.deleteSelectedLine}
          </button>

          <button
            type="button"
            className="btn-secondary-app h-8 px-3 text-xs text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={records.length === 0 || Boolean(savingKey)}
            onClick={() => void deleteAllLines()}
          >
            {labels.deleteAllLines}
          </button>
        </div>

        <p className="text-xs text-app-muted">
          Tab, Enter y flechas para moverte. Ctrl+Supr elimina una línea.
        </p>
      </div>

      <div
        ref={gridRef}
        className="max-w-full min-h-[300px] overflow-x-auto rounded-xl border border-app bg-app lg:min-h-[280px]"
      >
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-20 bg-app-soft">
            <tr className="bg-app-soft">
              {fields.map((field) => (
                <th
                  key={field.key}
                  className={[
                    "border-b border-app px-2 py-2 text-xs font-semibold uppercase tracking-wide text-app-muted whitespace-nowrap",
                    getSubformAlignmentClassName(field),
                    getSubformColumnClassName(field),
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {getFieldLabel(fieldLabels, field)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {records.map((record, rowIndex) => (
              <tr
                key={record.id}
                className={[
                  selectedRecordId === record.id
                    ? "bg-app-soft"
                    : "bg-app hover:bg-app-soft/40",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedRecordId(record.id)}
                onFocus={() => setSelectedRecordId(record.id)}
              >
                {fields.map((field, fieldIndex) => {
                  const fieldKey = `${record.id}:${field.dbName}`;
                  const isSavingThisField = savingKey === fieldKey;
                  const error = getFieldError(record.id, field);
                  const draft =
                    draftsById[record.id] ?? createEmptyDraft(fields);

                  return (
                    <td
                      key={field.key}
                      className={[
                        "border-b border-app px-2 py-1 align-top",
                        getSubformColumnClassName(field),
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {isAutocompleteField(field) ? (
                        <div className="flex items-start gap-1">
                          <div className="min-w-0 flex-1">
                            <AutocompleteInput
                              className={getSubformInputClassName({
                                field,
                                error,
                              })}
                              value={draft[field.dbName] ?? ""}
                              options={getAutocompleteOptions({ field, draft })}
                              placeholder="-"
                              disabled={field.editable === false}
                              required={field.required}
                              inputProps={{
                                "data-subform-row": rowIndex,
                                "data-subform-field": fieldIndex,
                                title:
                                  field.editable === false
                                    ? "Campo calculado"
                                    : "Busca y selecciona un valor.",
                                onKeyDown: (event) => {
                                  if (field.editable === false) {
                                    return;
                                  }

                                  void handleExistingInputKeyDown({
                                    event,
                                    record,
                                    rowIndex,
                                    field,
                                    fieldIndex,
                                  });
                                },
                              }}
                              onValueChange={(nextValue) => {
                                if (field.editable === false) {
                                  return;
                                }

                                void saveExistingSelectField({
                                  record,
                                  field,
                                  value: nextValue,
                                });
                              }}
                            />
                          </div>

                          {shouldShowPurchaseLineSourceLink(field) &&
                            getPurchaseLineSourceHref(draft) ? (
                            <Link
                              href={getPurchaseLineSourceHref(draft) ?? "#"}
                              className="mt-[1px] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-app text-xs font-semibold text-primary-app transition hover:bg-app-soft"
                              title="Abrir ficha"
                            >
                              ↗
                            </Link>
                          ) : null}
                        </div>
                      ) : field.type === "option" ? (
                        <select
                          data-subform-row={rowIndex}
                          data-subform-field={fieldIndex}
                          className={getSubformInputClassName({ field, error })}
                          title={
                            field.editable === false
                              ? "Campo calculado"
                              : "Selecciona un valor."
                          }
                          value={draft[field.dbName] ?? ""}
                          disabled={field.editable === false}
                          onChange={(event) => {
                            if (field.editable === false) {
                              return;
                            }

                            void saveExistingSelectField({
                              record,
                              field,
                              value: event.target.value,
                            });
                          }}
                          onKeyDown={(event) => {
                            if (field.editable === false) {
                              return;
                            }

                            void handleExistingInputKeyDown({
                              event,
                              record,
                              rowIndex,
                              field,
                              fieldIndex,
                            });
                          }}
                        >
                          <option value="">-</option>
                          {getSelectOptions({ field, draft }).map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          data-subform-row={rowIndex}
                          data-subform-field={fieldIndex}
                          className={getSubformInputClassName({ field, error })}
                          inputMode={getInputMode(field)}
                          title={
                            field.editable === false
                              ? "Campo calculado"
                              : "Enter/Flecha abajo baja de línea. Ctrl+Supr elimina."
                          }
                          value={draft[field.dbName] ?? ""}
                          disabled={field.editable === false}
                          onChange={(event) => {
                            if (field.editable === false) {
                              return;
                            }

                            setDraftValue({
                              id: record.id,
                              field,
                              value: event.target.value,
                            });
                          }}
                          onBlur={(event) => {
                            if (field.editable === false) {
                              return;
                            }

                            void handleExistingInputBlur({
                              record,
                              field,
                              rawValue: event.target.value,
                            });
                          }}
                          onKeyDown={(event) => {
                            if (field.editable === false) {
                              return;
                            }

                            void handleExistingInputKeyDown({
                              event,
                              record,
                              rowIndex,
                              field,
                              fieldIndex,
                            });
                          }}
                        />
                      )}

                      {error && (
                        <p className="mt-1 text-xs font-medium text-red-700">
                          {error}
                        </p>
                      )}

                      {isSavingThisField && (
                        <p className="mt-1 text-xs text-app-muted">
                          {labels.saving}
                        </p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr
              className="sticky bottom-0 z-10 bg-app shadow-[0_-1px_0_var(--color-border)]"
              onBlur={(event) => void handleNewRowBlur(event)}
            >
              {fields.map((field, fieldIndex) => {
                const error = getFieldError("new", field);
                const newRowIndex = records.length;

                return (
                  <td
                    key={field.key}
                    className={[
                      "px-2 py-1 align-top",
                      getSubformColumnClassName(field),
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {isAutocompleteField(field) ? (
                      <div className="flex items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <AutocompleteInput
                            className={getSubformInputClassName({
                              field,
                              error,
                            })}
                            value={newDraft[field.dbName] ?? ""}
                            options={getAutocompleteOptions({
                              field,
                              draft: newDraft,
                            })}
                            placeholder="-"
                            menuPlacement="auto"
                            disabled={
                              savingKey === "new" || field.editable === false
                            }
                            required={field.required}
                            inputProps={{
                              "data-subform-row": newRowIndex,
                              "data-subform-field": fieldIndex,
                              title:
                                field.editable === false
                                  ? "Campo calculado"
                                  : "Busca y selecciona un valor.",
                              onKeyDown: (event) => {
                                if (field.editable === false) {
                                  return;
                                }

                                void handleNewInputKeyDown({
                                  event,
                                  field,
                                  fieldIndex,
                                });
                              },
                            }}
                            onValueChange={(nextValue) => {
                              if (field.editable === false) {
                                return;
                              }

                              setNewDraftValue(field, nextValue);
                            }}
                          />
                        </div>

                        {shouldShowPurchaseLineSourceLink(field) &&
                          getPurchaseLineSourceHref(newDraft) ? (
                          <Link
                            href={getPurchaseLineSourceHref(newDraft) ?? "#"}
                            className="mt-[1px] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-app text-xs font-semibold text-primary-app transition hover:bg-app-soft"
                            title="Abrir ficha"
                          >
                            ↗
                          </Link>
                        ) : null}
                      </div>
                    ) : field.type === "option" ? (
                      <select
                        data-subform-row={newRowIndex}
                        data-subform-field={fieldIndex}
                        className={getSubformInputClassName({ field, error })}
                        title={
                          field.editable === false
                            ? "Campo calculado"
                            : "Selecciona un valor."
                        }
                        value={newDraft[field.dbName] ?? ""}
                        onChange={(event) => {
                          if (field.editable === false) {
                            return;
                          }

                          setNewDraftValue(field, event.target.value);
                        }}
                        onKeyDown={(event) => {
                          if (field.editable === false) {
                            return;
                          }

                          void handleNewInputKeyDown({
                            event,
                            field,
                            fieldIndex,
                          });
                        }}
                        disabled={savingKey === "new" || field.editable === false}
                      >
                        <option value="">-</option>
                        {getSelectOptions({
                          field,
                          draft: newDraft,
                        }).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        data-subform-row={newRowIndex}
                        data-subform-field={fieldIndex}
                        className={getSubformInputClassName({ field, error })}
                        inputMode={getInputMode(field)}
                        title={
                          field.editable === false
                            ? "Campo calculado"
                            : "Escribe y sal con Tab, Enter o flecha abajo para crear la línea."
                        }
                        value={newDraft[field.dbName] ?? ""}
                        onChange={(event) => {
                          if (field.editable === false) {
                            return;
                          }

                          setNewDraftValue(field, event.target.value);
                        }}
                        onKeyDown={(event) => {
                          if (field.editable === false) {
                            return;
                          }

                          void handleNewInputKeyDown({
                            event,
                            field,
                            fieldIndex,
                          });
                        }}
                        disabled={savingKey === "new" || field.editable === false}
                      />
                    )}

                    {error && (
                      <p className="mt-1 text-xs font-medium text-red-700">
                        {error}
                      </p>
                    )}

                    {savingKey === "new" && (
                      <p className="mt-1 text-xs text-app-muted">
                        {labels.saving}
                      </p>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-app bg-app-soft px-3 py-2 text-sm font-medium text-app-muted">
          {message}
        </div>
      )}
    </section>
  );
}
