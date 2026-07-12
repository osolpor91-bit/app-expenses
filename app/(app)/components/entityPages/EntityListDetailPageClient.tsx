"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useState } from "react";

import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type {
  EntityListActionsDefinition,
  EntityRecord,
  ListDetailEntityDefinition,
} from "@/lib/entities/core/entityDefinition";
import type { EntityOperationResult } from "@/lib/services/entityService";
import {
  getFieldLabel,
  getFieldOptionLabel,
  getFieldsForList,
} from "@/lib/entityFields/helpers";
import { formatFieldValueForDisplay } from "@/lib/formatters/fieldFormatters";
import { isTreasuryMovementType } from "@/lib/treasury/treasuryGeneral";

import SelectableEntityList, {
  type SelectableEntityRecord,
} from "../SelectableEntityList";
import EntityDocumentFactBox, {
  type EntityDocumentFactBoxLabels,
} from "../EntityDocumentFactBox";
import { deleteListDetailRecordAction } from "../../actions/entityActions";
import { getEntityDefinition } from "@/lib/entities/core/entityRegistry";
import BulkInventoryAdjustmentModal from "../../items/components/BulkInventoryAdjustmentModal";
import InventoryAdjustmentModal from "../../items/components/InventoryAdjustmentModal";
import TreasuryMovementModal, {
  type TreasuryAccountOption,
  type TreasuryMovementEditRecord,
  type TreasuryMemberOption,
} from "../../treasury-general/TreasuryMovementModal";
import WorkGroupActions, {
  type WorkGroupActionsData,
} from "../../work-groups/WorkGroupActions";
import ItemBalanceEntryEditModal, {
  type ItemBalanceEntryEditRecord,
} from "../../item-balance-entries/ItemBalanceEntryEditModal";

type GenericListDetailRecord = EntityRecord & SelectableEntityRecord;

type EntityListDetailPageClientLabels = {
  yes: string;
  no: string;
  title: string;
  emptyList: string;
  listHelpText: string;
  new: string;
  edit: string;
  delete: string;
  deleting: string;
  actions: string;
  noActionsAvailable: string;
  selectRecordToDelete: string;
  confirmDelete: string;
  deleteError: string;
  noRowsDeleted: string;
  recordDeleted: string;
  scopeUnavailableMessage?: string;
  [key: string]: string | undefined;
};

type EntityListDetailPageClientProps = {
  entity: ListDetailEntityDefinition;
  records: GenericListDetailRecord[];
  fieldLabels: Record<string, string>;
  visibleListFieldKeys?: string[];
  labels: EntityListDetailPageClientLabels;
  documentFactBoxLabels: EntityDocumentFactBoxLabels;
  listActions?: EntityListActionsDefinition;
  minWidthClass?: string;
  compactList?: boolean;
  compactTable?: boolean;
  scopeAvailable?: boolean;
  treasuryAccountOptions?: TreasuryAccountOption[];
  treasuryMemberOptions?: TreasuryMemberOption[];
  defaultTreasuryMemberId?: string;
  bulkInventoryAdjustmentItems?: GenericListDetailRecord[];
  workGroupActionsData?: WorkGroupActionsData;
};

function getListFields({
  entity,
  visibleListFieldKeys,
}: {
  entity: ListDetailEntityDefinition;
  visibleListFieldKeys?: string[];
}) {
  const baseFields = getFieldsForList(entity.fields);

  if (!visibleListFieldKeys) {
    return baseFields;
  }

  const visibleFieldKeys = new Set(visibleListFieldKeys);

  return baseFields.filter((field) => visibleFieldKeys.has(field.key));
}

function getRelationDisplayFieldName(field: EntityFieldDefinition) {
  return field.relation?.displayFieldName ?? field.dbName;
}

function getRecordHref(entity: ListDetailEntityDefinition, record: EntityRecord) {
  return `${entity.route}/${record.id}`;
}

function getRecordName({
  entity,
  record,
  fieldLabels,
}: {
  entity: ListDetailEntityDefinition;
  record: EntityRecord;
  fieldLabels: Record<string, string>;
}) {
  const primaryField = entity.fields.find(
    (field) => field.dbName === entity.primaryFieldDbName
  );

  const value = record[entity.primaryFieldDbName];

  if (!primaryField) {
    return String(value ?? "");
  }

  if (primaryField.type === "option") {
    return getFieldOptionLabel({
      field: primaryField,
      value,
      fieldLabels,
    });
  }

  return formatFieldValueForDisplay(primaryField, value);
}

function getReturnToPath({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams: URLSearchParams;
}) {
  const queryString = searchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

function addReturnToToHref({
  href,
  returnTo,
}: {
  href: string;
  returnTo: string;
}) {
  const [path = "", rawQueryString = ""] = href.split("?");
  const params = new URLSearchParams(rawQueryString);

  params.set("returnTo", returnTo);

  const queryString = params.toString();

  return queryString ? `${path}?${queryString}` : path;
}

function parseBooleanValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes" ||
    normalizedValue === "si" ||
    normalizedValue === "sí"
  );
}

function getCellValue({
  record,
  field,
  labels,
  fieldLabels,
}: {
  record: EntityRecord;
  field: EntityFieldDefinition;
  labels: Pick<EntityListDetailPageClientLabels, "yes" | "no">;
  fieldLabels: Record<string, string>;
}) {
  if (field.relation) {
    const value = record[getRelationDisplayFieldName(field)];

    if (value === null || value === undefined || value === "") {
      return "-";
    }

    return String(value);
  }

  const value = record[field.dbName];

  if (field.type === "boolean") {
    return parseBooleanValue(value) ? labels.yes : labels.no;
  }

  if (field.type === "option") {
    return getFieldOptionLabel({
      field,
      value,
      fieldLabels,
    });
  }

  return formatFieldValueForDisplay(field, value);
}

function getCellHref({
  record,
  field,
  returnTo,
}: {
  record: EntityRecord;
  field: EntityFieldDefinition;
  returnTo: string;
}) {
  if (!field.relation?.navigable) {
    return null;
  }

  const relatedEntity = getEntityDefinition(field.relation.entityKey);

  if (!relatedEntity || relatedEntity.pageMode !== "list-detail") {
    return null;
  }

  const relatedRecordId = record[field.dbName];

  if (
    relatedRecordId === null ||
    relatedRecordId === undefined ||
    relatedRecordId === ""
  ) {
    return null;
  }

  return addReturnToToHref({
    href: `${relatedEntity.route}/${String(relatedRecordId)}`,
    returnTo,
  });
}

function getEntityActionsContent(entity: ListDetailEntityDefinition) {
  if (entity.key !== "emailConfigurations") {
    return null;
  }

  return (
    <Link
      href="/email-send-logs?relatedType=table&relatedName=email_configurations"
      className="rounded-lg px-3 py-2 text-left text-sm text-app-muted transition hover:bg-app-soft hover:text-primary-app"
    >
      Logs
    </Link>
  );
}

export default function EntityListDetailPageClient({
  entity,
  records,
  fieldLabels,
  visibleListFieldKeys,
  labels,
  documentFactBoxLabels,
  listActions,
  minWidthClass,
  compactList = false,
  compactTable = false,
  scopeAvailable = true,
  treasuryAccountOptions = [],
  treasuryMemberOptions = [],
  defaultTreasuryMemberId = "",
  bulkInventoryAdjustmentItems = [],
  workGroupActionsData,
}: EntityListDetailPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTreasuryMovementTypeValue =
    entity.key === "treasuryGeneral"
      ? searchParams.get("addMovement") ?? ""
      : "";
  const requestedTreasuryMovementType = isTreasuryMovementType(
    requestedTreasuryMovementTypeValue
  )
    ? requestedTreasuryMovementTypeValue
    : "";
  const [isTreasuryMovementModalOpen, setIsTreasuryMovementModalOpen] =
    useState(Boolean(requestedTreasuryMovementType));
  const [defaultTreasuryMovementType, setDefaultTreasuryMovementType] =
    useState(requestedTreasuryMovementType);
  const [treasuryMovementToEdit, setTreasuryMovementToEdit] =
    useState<TreasuryMovementEditRecord | null>(null);
  const [itemBalanceEntryToEdit, setItemBalanceEntryToEdit] =
    useState<ItemBalanceEntryEditRecord | null>(null);
  const [treasuryMovementAttachmentCounts, setTreasuryMovementAttachmentCounts] =
    useState<Record<string, number>>({});
  const [
    isBulkInventoryAdjustmentModalOpen,
    setIsBulkInventoryAdjustmentModalOpen,
  ] = useState(
    entity.key === "items" && searchParams.get("adjustInventory") === "true"
  );

  const returnTo = getReturnToPath({
    pathname,
    searchParams,
  });

  const inventoryAdjustmentItemId =
    entity.key === "items" ? searchParams.get("adjustItemId") : null;

  const inventoryAdjustmentItem = inventoryAdjustmentItemId
    ? records.find((record) => record.id === inventoryAdjustmentItemId) ?? null
    : null;

  function closeInventoryAdjustmentModal() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("adjustItemId");

    const queryString = params.toString();

    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function closeBulkInventoryAdjustmentModal() {
    setIsBulkInventoryAdjustmentModalOpen(false);

    if (!searchParams.has("adjustInventory")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.delete("adjustInventory");

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function closeTreasuryMovementModal() {
    setIsTreasuryMovementModalOpen(false);
    setDefaultTreasuryMovementType("");

    if (!searchParams.has("addMovement")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("addMovement");

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  const handleTreasuryMovementDocumentCountChange = useCallback(
    (recordId: string, count: number) => {
      setTreasuryMovementAttachmentCounts((currentCounts) => {
        if (currentCounts[recordId] === count) {
          return currentCounts;
        }

        return {
          ...currentCounts,
          [recordId]: count,
        };
      });
    },
    []
  );

  function getTreasuryMovementChangeDisabledReason(
    record: GenericListDetailRecord
  ) {
    if (entity.key !== "treasuryGeneralMovements") {
      return null;
    }

    const attachmentCount = treasuryMovementAttachmentCounts[record.id];

    if (attachmentCount === undefined) {
      return (
        labels.attachmentsChecking ??
        "Comprobando los adjuntos del movimiento..."
      );
    }

    if (attachmentCount > 0) {
      return (
        labels.attachmentsLockMessage ??
        "Este movimiento tiene adjuntos. Elimínalos antes de modificarlo o eliminarlo."
      );
    }

    return null;
  }

  async function deleteRecord(
    id: string
  ): Promise<EntityOperationResult<{ id: string }>> {
    return deleteListDetailRecordAction({
      entityKey: entity.key,
      id,
    });
  }

  return (
    <>
      <SelectableEntityList
        records={records}
        fields={getListFields({
          entity,
          visibleListFieldKeys,
        })}
        fieldLabels={fieldLabels}
        labels={labels}
        newHref={entity.newRoute}
        listActions={listActions}
        minWidthClass={minWidthClass}
        compact={compactList}
        compactTable={compactTable}
        primaryFieldDbName={entity.primaryFieldDbName}
        autoSelectFirstRecord
        renderToolbarContent={(selectedRecord) => {
          if (entity.key === "items") {
            return (
              <button
                type="button"
                onClick={() => setIsBulkInventoryAdjustmentModalOpen(true)}
                disabled={!scopeAvailable}
                className="btn-primary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.bulkInventoryAdjustmentAction ?? "Ajustar inventario"}
              </button>
            );
          }

          if (entity.key === "treasuryGeneralMovements") {
            const changeDisabledReason = selectedRecord
              ? getTreasuryMovementChangeDisabledReason(selectedRecord)
              : null;
            const hasAttachments = selectedRecord
              ? (treasuryMovementAttachmentCounts[selectedRecord.id] ?? 0) > 0
              : false;

            return (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedRecord || changeDisabledReason) {
                      return;
                    }

                    setTreasuryMovementToEdit({
                      id: selectedRecord.id,
                      treasury_type: selectedRecord.treasury_type,
                      amount: selectedRecord.amount,
                      movement_date: selectedRecord.movement_date,
                      account_id: selectedRecord.account_id,
                      paid_by_member_id: selectedRecord.paid_by_member_id,
                      entry_description: selectedRecord.entry_description,
                      is_expense_closed: selectedRecord.is_expense_closed,
                    });
                  }}
                  disabled={!selectedRecord || Boolean(changeDisabledReason)}
                  title={changeDisabledReason ?? undefined}
                  className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {labels.treasuryMovementEditAction ?? "Modificar datos"}
                </button>

                {hasAttachments ? (
                  <span className="text-xs font-medium text-amber-700">
                    {labels.attachmentsLockMessage}
                  </span>
                ) : null}
              </>
            );
          }

          if (entity.key === "itemBalanceEntries") {
            return (
              <button
                type="button"
                onClick={() => {
                  if (!selectedRecord) {
                    return;
                  }

                  setItemBalanceEntryToEdit({
                    id: selectedRecord.id,
                    item_code: selectedRecord.item_code,
                    item_description: selectedRecord.item_description,
                    created_at: selectedRecord.created_at,
                    quantity: selectedRecord.quantity,
                    comment: selectedRecord.comment,
                    unit_of_measure: selectedRecord.unit_of_measure,
                  });
                }}
                disabled={!selectedRecord}
                className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.modifyAction ?? "Modificar"}
              </button>
            );
          }

          if (entity.key === "workGroups" && workGroupActionsData) {
            return (
              <WorkGroupActions
                {...workGroupActionsData}
                selectedRecord={selectedRecord}
              />
            );
          }

          if (entity.key !== "treasuryGeneral") {
            return null;
          }

          const selectedTreasuryType = String(
            selectedRecord?.treasury_type ?? ""
          ).trim();
          const canViewMovements = Boolean(selectedTreasuryType);

          return (
            <>
              <button
                type="button"
                onClick={() => {
                  setDefaultTreasuryMovementType(selectedTreasuryType);
                  setIsTreasuryMovementModalOpen(true);
                }}
                disabled={!scopeAvailable}
                className="btn-primary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.treasuryMovementAction ?? "Añadir movimiento"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canViewMovements) {
                    return;
                  }

                  const params = new URLSearchParams({
                    type: selectedTreasuryType,
                  });

                  router.push(
                    `/treasury-general/movements?${params.toString()}`
                  );
                }}
                disabled={!canViewMovements}
                className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.treasuryMovementsAction ?? "Ver movimientos"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/treasury-general/balance")}
                disabled={!scopeAvailable}
                className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.treasuryBalanceAction ?? "Balance"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/treasury-general/detailed-balance")
                }
                disabled={!scopeAvailable}
                className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.treasuryDetailedBalanceAction ??
                  "Balance detallado"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/treasury-general/pending-settlements")
                }
                disabled={!scopeAvailable}
                className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.treasuryPendingSettlementsAction ??
                  "Liquidaciones pendientes"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/treasury-general/settle-payments")
                }
                disabled={!scopeAvailable}
                className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.treasurySettlePaymentsAction ?? "Liquidar pagos"}
              </button>
            </>
          );
        }}
        actionsContent={getEntityActionsContent(entity)}
        getDeleteDisabledReason={getTreasuryMovementChangeDisabledReason}
        scopeAvailable={scopeAvailable}
        deleteRecordAction={deleteRecord}
        getRecordHref={(record) => getRecordHref(entity, record)}
        getRecordName={(record) =>
          getRecordName({
            entity,
            record,
            fieldLabels,
          })
        }
        getFieldLabel={getFieldLabel}
        getCellValue={(record, field) =>
          getCellValue({
            record,
            field,
            labels,
            fieldLabels,
          })
        }
        getCellHref={(record, field) =>
          getCellHref({
            record,
            field,
            returnTo,
          })
        }
        renderSidePanel={
          entity.key === "treasuryGeneralMovements"
            ? (selectedRecord) => (
                <EntityDocumentFactBox
                  entityKey={entity.key}
                  recordId={selectedRecord?.id ?? null}
                  factBoxKey="attachments"
                  labels={documentFactBoxLabels}
                  onDocumentCountChange={(count) => {
                    if (!selectedRecord) {
                      return;
                    }

                    handleTreasuryMovementDocumentCountChange(
                      selectedRecord.id,
                      count
                    );
                  }}
                />
              )
            : undefined
        }
      />

      {entity.key === "items" && inventoryAdjustmentItemId ? (
        <InventoryAdjustmentModal
          key={inventoryAdjustmentItemId}
          item={inventoryAdjustmentItem}
          labels={labels}
          onClose={closeInventoryAdjustmentModal}
        />
      ) : null}

      {entity.key === "items" && isBulkInventoryAdjustmentModalOpen ? (
        <BulkInventoryAdjustmentModal
          key={bulkInventoryAdjustmentItems.map((item) => item.id).join("|")}
          items={bulkInventoryAdjustmentItems}
          labels={labels}
          onClose={closeBulkInventoryAdjustmentModal}
        />
      ) : null}

      {entity.key === "treasuryGeneral" && isTreasuryMovementModalOpen ? (
        <TreasuryMovementModal
          accountOptions={treasuryAccountOptions}
          memberOptions={treasuryMemberOptions}
          defaultMemberId={defaultTreasuryMemberId}
          defaultTreasuryType={defaultTreasuryMovementType}
          labels={labels}
          onClose={closeTreasuryMovementModal}
        />
      ) : null}

      {entity.key === "treasuryGeneralMovements" && treasuryMovementToEdit ? (
        <TreasuryMovementModal
          accountOptions={treasuryAccountOptions}
          memberOptions={treasuryMemberOptions}
          defaultMemberId={defaultTreasuryMemberId}
          movement={treasuryMovementToEdit}
          labels={labels}
          onClose={() => setTreasuryMovementToEdit(null)}
        />
      ) : null}

      {entity.key === "itemBalanceEntries" && itemBalanceEntryToEdit ? (
        <ItemBalanceEntryEditModal
          entry={itemBalanceEntryToEdit}
          labels={labels}
          onClose={() => setItemBalanceEntryToEdit(null)}
        />
      ) : null}
    </>
  );
}
