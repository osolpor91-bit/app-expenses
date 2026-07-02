import FilterBar from "../../components/FilterBar";
import AdminReadOnlyTable, {
  type AdminReadOnlyRecord,
} from "./AdminReadOnlyTable";

type CommonLabels = {
  search: string;
  searchPlaceholder: string;
  applyFilters: string;
  clearFilters: string;
  filters: string;
  hideFilters: string;
  yes: string;
  no: string;
};

type AdminTableLabels = {
  readOnlyNotice: string;
  emptyList: string;
  columns: Record<string, string>;
};

type AdminTablePageProps = {
  title: string;
  description?: string;
  rows: AdminReadOnlyRecord[];
  commonLabels: CommonLabels;
  adminTableLabels: AdminTableLabels;
  preferredColumns: string[];
  hiddenColumns?: string[];
  searchValue?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  columnLabels?: Record<string, string>;
};

export default function AdminTablePage({
  title,
  description,
  rows,
  commonLabels,
  adminTableLabels,
  preferredColumns,
  hiddenColumns = [],
  searchValue,
  searchPlaceholder,
  emptyLabel,
  columnLabels,
}: AdminTablePageProps) {
  const showSearch = searchValue !== undefined;

  return (
    <section>
      <h1 className="text-2xl font-bold text-primary-app sm:text-3xl">
        {title}
      </h1>

      <p className="mt-2 text-sm text-app-muted">
        {description ?? adminTableLabels.readOnlyNotice}
      </p>

      {showSearch && (
        <div className="mt-4">
          <FilterBar
            initialValues={{
              search: searchValue,
            }}
            labels={{
              apply: commonLabels.applyFilters,
              clear: commonLabels.clearFilters,
              filters: commonLabels.filters,
              hideFilters: commonLabels.hideFilters,
            }}
            primaryFields={[
              {
                type: "text",
                name: "search",
                label: commonLabels.search,
                placeholder: searchPlaceholder ?? commonLabels.searchPlaceholder,
              },
            ]}
          />
        </div>
      )}

      <div className="mt-6">
        <AdminReadOnlyTable
          rows={rows}
          columnLabels={columnLabels ?? adminTableLabels.columns}
          emptyLabel={emptyLabel ?? adminTableLabels.emptyList}
          yesLabel={commonLabels.yes}
          noLabel={commonLabels.no}
          preferredColumns={preferredColumns}
          hiddenColumns={hiddenColumns}
        />
      </div>
    </section>
  );
}