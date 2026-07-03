"use client";

import { useRouter } from "next/navigation";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type {
  EditableGridEntityDefinition,
  EntityGridColumnLayout,
  EntityRecord,
} from "@/lib/entities/core/entityDefinition";
import type { EntityValuesInput } from "@/lib/entities/core/entityService";
import type { EntityOperationResult } from "@/lib/services/entityService";
import {
  getFieldLabel,
  getFieldOptionLabel,
  getFieldsForGrid,
  getFieldsForList,
} from "@/lib/entityFields/helpers";
import type { ReactNode } from "react";

import ActionsMenu from "../ActionsMenu";
import EditableEntityGrid, {
  type EditableGridRecord,
} from "../EditableEntityGrid";
import EditableListPageClient from "../EditableListPageClient";
import {
  cleanGridRowsForParent,
  createEmptyGridRow,
  sortGridRowsByTextField,
  sortGridRowsByTextFields,
  validateGridPayload,
} from "../editableGridHelpers";
import {
  buildEditableAutocompleteGridColumn,
  buildEditableGridColumns,
} from "../editableGridColumnHelpers";
import {
  getAutocompleteLabels,
  getAutocompletePayloadId,
  hasInvalidAutocompleteValue,
  hasValidAutocompleteValue,
  type EditableGridAutocompleteOption,
} from "../editableGridRelationHelpers";
import {
  createEntityGridRecordAction,
  deleteEntityGridRecordsAction,
  refreshEntityGridAction,
  updateEntityGridRecordAction,
} from "../../actions/entityActions";

type GenericGridRecord = EntityRecord & EditableGridRecord;

type RelationOptionsByField = Record<string, EditableGridAutocompleteOption[]>;

type EntityEditableGridLabels = {
  yes: string;
  no: string;

  emptyList: string;
  errorRefreshing: string;

  actions: string;
  noActionsAvailable: string;
  editList: string;
  viewList: string;
  loading: string;

  validationMessages: Record<string, unknown>;

  grid: {
    deleteSelected: string;
    selectedSuffix: string;
    helpText: string;
    createRequiredFields: string;
    requiredFields: string;
    saveError: string;
    createError: string;
    deleteError: string;
    countryCreated?: string;
    companyCreated?: string;
    recordCreated?: string;
    changeSaved: string;
    selectAtLeastOneToDelete: string;
    confirmDelete: string;
    noRowsDeleted: string;
    countriesDeleted?: string;
    companiesDeleted?: string;
    recordsDeleted?: string;
    invalidRelation?: string;
  };
};

type EntityEditableGridPageClientProps = {
  entity: EditableGridEntityDefinition;
  tenantId: string;
  records: GenericGridRecord[];
  filters: Record<string, string>;
  relationOptionsByField?: RelationOptionsByField;
  fieldLabels: Record<string, string>;
  labels: EntityEditableGridLabels;
  viewActions?: ReactNode;
  minWidthClass?: string;
};

function getEntityListFields(entity: EditableGridEntityDefinition) {
  return getFieldsForList(entity.fields);
}

function getEntityGridFields(entity: EditableGridEntityDefinition) {
  return getFieldsForGrid(entity.fields);
}

function getRelationDisplayFieldName(field: EntityFieldDefinition) {
  return field.relation?.displayFieldName ?? field.dbName;
}

function getEntityRelationDisplayFields(entity: EditableGridEntityDefinition) {
  return entity.fields
    .filter((field) => Boolean(field.relation?.displayFieldName))
    .map((field) => getRelationDisplayFieldName(field));
}

function getEntityColumnLayout(entity: EditableGridEntityDefinition) {
  return (field: EntityFieldDefinition): EntityGridColumnLayout => {
    return (
      entity.grid?.columnLayouts?.[field.dbName] ??
      entity.grid?.defaultColumnLayout ??
      {}
    );
  };
}

function sortEntityRecords(
  entity: EditableGridEntityDefinition,
  records: GenericGridRecord[]
) {
  if (entity.grid?.sortBy?.length) {
    return sortGridRowsByTextFields(records, entity.grid.sortBy);
  }

  return sortGridRowsByTextField(records, entity.primaryFieldDbName);
}

function createEmptyEntityRow(
  entity: EditableGridEntityDefinition,
  tenantId: string
) {
  const relationDisplayValues = getEntityRelationDisplayFields(entity).reduce<
    Record<string, unknown>
  >((values, displayFieldName) => {
    values[displayFieldName] = null;
    return values;
  }, {});

  return createEmptyGridRow<GenericGridRecord>({
    tenantId,
    newRowId: entity.newRowId,
    fields: getEntityGridFields(entity),
    extraValues: relationDisplayValues,
  });
}

function cleanEntityRowsForParent(
  entity: EditableGridEntityDefinition,
  rows: GenericGridRecord[]
) {
  return sortEntityRecords(
    entity,
    cleanGridRowsForParent({
      rows,
      fields: getEntityGridFields(entity),
      extraFields: getEntityRelationDisplayFields(entity),
    })
  );
}

function buildEntityGridPayload({
  entity,
  row,
  relationOptionsByField,
}: {
  entity: EditableGridEntityDefinition;
  row: GenericGridRecord;
  relationOptionsByField: RelationOptionsByField;
}) {
  const payload: Record<string, string | boolean | null> = {};

  getEntityGridFields(entity).forEach((field) => {
    if (field.relation) {
      payload[field.dbName] = getAutocompletePayloadId({
        row,
        displayFieldName: getRelationDisplayFieldName(field),
        options: relationOptionsByField[field.dbName] ?? [],
      });
      return;
    }

    if (field.type === "boolean") {
      payload[field.dbName] = Boolean(row[field.dbName]);
      return;
    }

    const value = String(row[field.dbName] ?? "").trim();
    payload[field.dbName] = value || null;
  });

  return payload;
}

function hasRequiredEntityValues({
  entity,
  row,
  relationOptionsByField,
}: {
  entity: EditableGridEntityDefinition;
  row: GenericGridRecord;
  relationOptionsByField: RelationOptionsByField;
}) {
  return getEntityGridFields(entity)
    .filter((field) => field.required)
    .every((field) => {
      if (field.relation) {
        return hasValidAutocompleteValue({
          row,
          displayFieldName: getRelationDisplayFieldName(field),
          options: relationOptionsByField[field.dbName] ?? [],
        });
      }

      return String(row[field.dbName] ?? "").trim();
    });
}

function validateEntityFormats({
  entity,
  row,
  validationMessages,
  relationOptionsByField,
}: {
  entity: EditableGridEntityDefinition;
  row: GenericGridRecord;
  validationMessages: Record<string, unknown>;
  relationOptionsByField: RelationOptionsByField;
}) {
  return validateGridPayload({
    fields: getEntityGridFields(entity),
    payload: buildEntityGridPayload({
      entity,
      row,
      relationOptionsByField,
    }),
    validationMessages,
  });
}

function getInvalidRelationField({
  entity,
  row,
  relationOptionsByField,
}: {
  entity: EditableGridEntityDefinition;
  row: GenericGridRecord;
  relationOptionsByField: RelationOptionsByField;
}) {
  return getEntityGridFields(entity).find((field) => {
    if (!field.relation) {
      return false;
    }

    return hasInvalidAutocompleteValue({
      row,
      displayFieldName: getRelationDisplayFieldName(field),
      options: relationOptionsByField[field.dbName] ?? [],
    });
  });
}

function getInvalidRelationMessage({
  field,
  fieldLabels,
  labels,
}: {
  field: EntityFieldDefinition;
  fieldLabels: Record<string, string>;
  labels: EntityEditableGridLabels;
}) {
  const fieldLabel = getFieldLabel(fieldLabels, field);
  const baseMessage =
    labels.grid.invalidRelation ??
    String(labels.validationMessages.invalidValue ?? "El valor no es válido.");

  return `${fieldLabel}: ${baseMessage}`;
}

function getPartialValidationFields({
  entity,
  row,
}: {
  entity: EditableGridEntityDefinition;
  row: GenericGridRecord;
}) {
  return getEntityGridFields(entity).filter((field) => {
    if (field.type === "boolean") {
      return false;
    }

    if (field.relation) {
      return String(row[getRelationDisplayFieldName(field)] ?? "").trim();
    }

    return String(row[field.dbName] ?? "").trim();
  });
}

function validatePartialEntityRow({
  entity,
  row,
  validationMessages,
  relationOptionsByField,
  fieldLabels,
  labels,
}: {
  entity: EditableGridEntityDefinition;
  row: GenericGridRecord;
  validationMessages: Record<string, unknown>;
  relationOptionsByField: RelationOptionsByField;
  fieldLabels: Record<string, string>;
  labels: EntityEditableGridLabels;
}) {
  const partialFields = getPartialValidationFields({
    entity,
    row,
  });

  if (partialFields.length > 0) {
    const formatValidationMessage = validateGridPayload({
      fields: partialFields,
      payload: buildEntityGridPayload({
        entity,
        row,
        relationOptionsByField,
      }),
      validationMessages,
    });

    if (formatValidationMessage) {
      return formatValidationMessage;
    }
  }

  const invalidRelationField = getInvalidRelationField({
    entity,
    row,
    relationOptionsByField,
  });

  if (invalidRelationField) {
    return getInvalidRelationMessage({
      field: invalidRelationField,
      fieldLabels,
      labels,
    });
  }

  return null;
}

function validateEntityRow({
  entity,
  row,
  isNew,
  labels,
  relationOptionsByField,
  fieldLabels,
}: {
  entity: EditableGridEntityDefinition;
  row: GenericGridRecord;
  isNew: boolean;
  labels: EntityEditableGridLabels;
  relationOptionsByField: RelationOptionsByField;
  fieldLabels: Record<string, string>;
}) {
  const partialValidationMessage = validatePartialEntityRow({
    entity,
    row,
    validationMessages: labels.validationMessages,
    relationOptionsByField,
    fieldLabels,
    labels,
  });

  if (partialValidationMessage) {
    return partialValidationMessage;
  }

  if (
    !hasRequiredEntityValues({
      entity,
      row,
      relationOptionsByField,
    })
  ) {
    return isNew
      ? labels.grid.createRequiredFields
      : labels.grid.requiredFields;
  }

  return null;
}

function getEntityCellValue(
  record: GenericGridRecord,
  field: EntityFieldDefinition,
  labels: Pick<EntityEditableGridLabels, "yes" | "no">,
  fieldLabels: Record<string, string>
) {
  if (field.relation) {
    const displayValue = record[getRelationDisplayFieldName(field)];

    if (
      displayValue === null ||
      displayValue === undefined ||
      displayValue === ""
    ) {
      return "-";
    }

    return String(displayValue);
  }

  const value = record[field.dbName];

  if (field.type === "boolean") {
    return value ? labels.yes : labels.no;
  }

  if (field.type === "option") {
    return getFieldOptionLabel({
      field,
      value,
      fieldLabels,
    });
  }

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function getCreatedMessage(labels: EntityEditableGridLabels) {
  return (
    labels.grid.recordCreated ??
    labels.grid.countryCreated ??
    labels.grid.companyCreated ??
    labels.grid.changeSaved
  );
}

function getDeletedMessage(labels: EntityEditableGridLabels) {
  return (
    labels.grid.recordsDeleted ??
    labels.grid.countriesDeleted ??
    labels.grid.companiesDeleted ??
    labels.grid.noRowsDeleted
  );
}

export default function EntityEditableGridPageClient({
  entity,
  tenantId,
  records,
  filters,
  relationOptionsByField = {},
  fieldLabels,
  labels,
  viewActions,
  minWidthClass = "min-w-[620px]",
}: EntityEditableGridPageClientProps) {
  const router = useRouter();

  async function refreshRecords() {
    const result = await refreshEntityGridAction({
      entityKey: entity.key,
      filters,
    });

    if (!result.ok) {
      return {
        error: `${labels.errorRefreshing}: ${result.error}`,
      };
    }

    return {
      records: result.data.records as GenericGridRecord[],
    };
  }

  async function createRecord(
    payload: Record<string, string | boolean | null>
  ): Promise<EntityOperationResult<{ record: GenericGridRecord }>> {
    const result = await createEntityGridRecordAction({
      entityKey: entity.key,
      payload: payload as EntityValuesInput,
    });

    if (!result.ok) {
      return result;
    }

    if (entity.key === "treasuryMembers" && payload.is_default === true) {
      router.refresh();
    }

    return {
      ok: true,
      data: {
        record: result.data.record as GenericGridRecord,
      },
    };
  }

  async function updateRecord({
    id,
    payload,
  }: {
    id: string;
    payload: Record<string, string | boolean | null>;
  }): Promise<EntityOperationResult<{ record: GenericGridRecord }>> {
    const result = await updateEntityGridRecordAction({
      entityKey: entity.key,
      id,
      payload: payload as EntityValuesInput,
    });

    if (!result.ok) {
      return result;
    }

    if (entity.key === "treasuryMembers" && payload.is_default === true) {
      router.refresh();
    }

    return {
      ok: true,
      data: {
        record: result.data.record as GenericGridRecord,
      },
    };
  }

  async function deleteRecords(
    ids: string[]
  ): Promise<EntityOperationResult<{ ids: string[] }>> {
    return deleteEntityGridRecordsAction({
      entityKey: entity.key,
      ids,
    });
  }

  const listFields = getEntityListFields(entity);
  const gridFields = getEntityGridFields(entity);

  return (
    <EditableListPageClient
      records={records}
      fields={listFields}
      fieldLabels={fieldLabels}
      labels={labels}
      viewActions={
        <ActionsMenu
          label={labels.actions}
          emptyLabel={labels.noActionsAvailable}
        >
          {viewActions ?? null}
        </ActionsMenu>
      }
      minWidthClass={minWidthClass}
      primaryColumnDbName={entity.primaryFieldDbName}
      sortRecords={(items) => sortEntityRecords(entity, items)}
      refreshRecords={refreshRecords}
      getFieldLabel={(currentFieldLabels, field) =>
        getFieldLabel(currentFieldLabels, field)
      }
      getCellValue={(record, field) =>
        getEntityCellValue(record, field, labels, fieldLabels)
      }
      renderEditContent={({
        backButton,
        records: currentRecords,
        setRecords,
      }) => {
        const columns = buildEditableGridColumns<GenericGridRecord>({
          fields: gridFields,
          fieldLabels,
          getFieldLabel,
          getColumnLayout: getEntityColumnLayout(entity),
          booleanLabels: {
            yesLabel: labels.yes,
            noLabel: labels.no,
          },
          customColumnBuilders: Object.fromEntries(
            gridFields
              .filter((field) => Boolean(field.relation))
              .map((field) => [
                field.dbName,
                ({ headerName }) =>
                  buildEditableAutocompleteGridColumn<GenericGridRecord>({
                    field,
                    headerName,
                    displayFieldName: getRelationDisplayFieldName(field),
                    optionLabels: getAutocompleteLabels(
                      relationOptionsByField[field.dbName] ?? []
                    ),
                    ...getEntityColumnLayout(entity)(field),
                  }),
              ])
          ),
        });

        const pinnedColumns = columns.map((column, index) => {
          if (index !== 0) {
            return column;
          }

          return {
            ...column,
            pinned: "left" as const,
          };
        });

        return (
          <EditableEntityGrid
            tenantId={tenantId}
            newRowId={entity.newRowId}
            records={currentRecords}
            columns={pinnedColumns}
            backButton={backButton}
            labels={labels.grid}
            createdMessage={getCreatedMessage(labels)}
            deletedMessage={getDeletedMessage(labels)}
            heightClass={entity.grid?.heightClass}
            createEmptyRow={(currentTenantId) =>
              createEmptyEntityRow(entity, currentTenantId)
            }
            sortRows={(items) => sortEntityRecords(entity, items)}
            cleanRowsForParent={(items) =>
              cleanEntityRowsForParent(entity, items)
            }
            buildPayload={(row) =>
              buildEntityGridPayload({
                entity,
                row,
                relationOptionsByField,
              })
            }
            validateRow={(row, isNew) =>
              validateEntityRow({
                entity,
                row,
                isNew,
                labels,
                relationOptionsByField,
                fieldLabels,
              })
            }
            validatePartialNewRow={(row) =>
              validatePartialEntityRow({
                entity,
                row,
                validationMessages: labels.validationMessages,
                relationOptionsByField,
                fieldLabels,
                labels,
              })
            }
            isNewRowReadyToCreate={(row) =>
              hasRequiredEntityValues({
                entity,
                row,
                relationOptionsByField,
              })
            }
            createRecordAction={createRecord}
            updateRecordAction={updateRecord}
            deleteRecordsAction={deleteRecords}
            onRowsChange={(updatedRecords) =>
              setRecords(sortEntityRecords(entity, updatedRecords))
            }
          />
        );
      }}
    />
  );
}
