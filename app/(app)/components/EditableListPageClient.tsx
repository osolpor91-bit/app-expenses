"use client";

import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useState } from "react";

import EntityReadOnlyTable from "./EntityReadOnlyTable";
import ListEditSwitcher from "./ListEditSwitcher";

type EditableListPageLabels = {
  emptyList: string;
  editList: string;
  viewList: string;
  loading: string;
};

type RefreshResult<TRecord> =
  | {
      records: TRecord[];
      error?: undefined;
    }
  | {
      records?: undefined;
      error: string;
    };

type EditableListPageClientProps<TRecord extends { id: string }> = {
  records: TRecord[];
  fields: readonly EntityFieldDefinition[];
  fieldLabels: Record<string, string>;
  labels: EditableListPageLabels;
  viewActions?: ReactNode;
  minWidthClass?: string;
  primaryColumnDbName: string;
  sortRecords: (records: TRecord[]) => TRecord[];
  refreshRecords: () => Promise<RefreshResult<TRecord>>;
  getFieldLabel: (
    fieldLabels: Record<string, string>,
    field: EntityFieldDefinition
  ) => string;
  getCellValue: (record: TRecord, field: EntityFieldDefinition) => string;
  renderEditContent: (props: {
    backButton: ReactNode;
    records: TRecord[];
    setRecords: Dispatch<SetStateAction<TRecord[]>>;
  }) => ReactNode;
};

export default function EditableListPageClient<
  TRecord extends { id: string },
>({
  records,
  fields,
  fieldLabels,
  labels,
  viewActions,
  minWidthClass,
  primaryColumnDbName,
  sortRecords,
  refreshRecords,
  getFieldLabel,
  getCellValue,
  renderEditContent,
}: EditableListPageClientProps<TRecord>) {
  const [currentRecords, setCurrentRecords] = useState<TRecord[]>(
    sortRecords(records)
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentRecords(sortRecords(records));
  }, [records, sortRecords]);

  async function loadRecords() {
    setMessage(null);

    const result = await refreshRecords();

    if (result.error) {
      setMessage(result.error);
      return;
    }

    const refreshedRecords = result.records ?? [];

    setCurrentRecords(sortRecords(refreshedRecords));
  }

  return (
    <div className="mt-0">
      {message && (
        <div className="mb-2 rounded-lg border border-app-border bg-app-soft px-3 py-1.5 text-xs text-app-muted">
          {message}
        </div>
      )}

      <ListEditSwitcher
        editButtonLabel={labels.editList}
        viewButtonLabel={labels.viewList}
        loadingLabel={labels.loading}
        onBeforeOpenEdit={loadRecords}
        onBeforeBackToView={loadRecords}
        viewActions={viewActions}
        viewContent={
          <EntityReadOnlyTable
            records={currentRecords}
            fields={fields}
            fieldLabels={fieldLabels}
            emptyLabel={labels.emptyList}
            minWidthClass={minWidthClass}
            primaryColumnDbName={primaryColumnDbName}
            getFieldLabel={getFieldLabel}
            getCellValue={getCellValue}
          />
        }
        renderEditContent={({ backButton }) =>
          renderEditContent({
            backButton,
            records: currentRecords,
            setRecords: setCurrentRecords,
          })
        }
      />
    </div>
  );
}