import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export type EntityScope = "tenant" | "company";

export type EntityPageMode = "editable-grid" | "list-detail";

export type EntityOrderByDefinition = {
  column: string;
  ascending?: boolean;
};

export type EntityStaticFilterDefinition = {
  column: string;
  value: string | number | boolean | null;
  operator?: "eq";
};
export type EntityGridColumnLayout = {
  flex?: number;
  minWidth?: number;
};

export type EntityGridSortDefinition = {
  fieldName: string;
  direction?: "asc" | "desc";
};

export type EntityGridDefinition = {
  heightClass?: string;
  defaultColumnLayout?: EntityGridColumnLayout;
  columnLayouts?: Record<string, EntityGridColumnLayout>;
  sortBy?: readonly EntityGridSortDefinition[];
};

export type EntityFormColumnCount = 1 | 2 | 3 | 4;

export type EntityFormFieldPlacement = {
  field: string;
  colSpan?: "full";
};

export type EntityFormSectionDefinition = {
  key: string;
  labelKey?: string;
  columns?: EntityFormColumnCount;
  fields: readonly (string | EntityFormFieldPlacement)[];
};

export type EntityFormLayoutDefinition = {
  type: "sections";
  sections: readonly EntityFormSectionDefinition[];
};

export type EntitySubformMode = "editable-grid";

export type EntitySubformDefinition = {
  key: string;
  table: string;
  labelsKey: string;
  quickCreateOnTabFieldDbName?: string;

  /**
   * Campo de la tabla hija que enlaza con la cabecera.
   * Ejemplo: sales_invoice_id.
   */
  parentIdDbName: string;

  scope: EntityScope;
  mode: EntitySubformMode;

  fields: readonly EntityFieldDefinition[];
  selectColumns: string;

  updatedAtColumn?: string;
  orderBy?: EntityOrderByDefinition;
};

export type EntityRecordSummaryFactBoxDefinition = {
  key: string;
  type: "recordSummary";
  titleLabelKey?: string;
  fieldDbNames?: readonly string[];
};

export type EntityStaticTextFactBoxDefinition = {
  key: string;
  type: "staticText";
  titleLabelKey: string;
  textLabelKey: string;
};

export type EntityDocumentFactBoxDefinition = {
  key: string;
  type: "document";
  table: string;
  entityTableDbName?: string;
  parentIdDbName: string;

  storageProviderDbName: string;

  supabaseBucketDbName?: string;
  supabasePathDbName?: string;

  sharepointWebUrlDbName?: string;

  originalFileNameDbName: string;
  contentTypeDbName?: string;
  sizeBytesDbName?: string;

  orderBy?: EntityOrderByDefinition;
};

export type EntityFactBoxDefinition =
  | EntityRecordSummaryFactBoxDefinition
  | EntityStaticTextFactBoxDefinition
  | EntityDocumentFactBoxDefinition;

export type BaseEntityDefinition = {
  key: string;
  table: string;
  route: string;
  labelsKey: string;
  scope: EntityScope;
  pageMode: EntityPageMode;

  primaryFieldDbName: string;

  fields: readonly EntityFieldDefinition[];
  selectColumns: string;

  /**
   * Optional timestamp column to be set automatically on create/update.
   * Example: "updated_at".
   */
  updatedAtColumn?: string;

  searchColumns?: readonly string[];
  filters?: readonly EntityFilterDefinition[];
  staticFilters?: readonly EntityStaticFilterDefinition[];

  orderBy?: EntityOrderByDefinition;
};

export type EditableGridEntityDefinition = BaseEntityDefinition & {
  pageMode: "editable-grid";
  newRowId: string;
  grid?: EntityGridDefinition;
};

export type EntityListRecordActionDefinition = {
  key: string;
  labelKey: string;
  route: string;
  recordIdParamName: string;
};

export type EntityListActionsDefinition = {
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  recordActions?: readonly EntityListRecordActionDefinition[];
};

export type ListDetailEntityDefinition = BaseEntityDefinition & {
  pageMode: "list-detail";
  newRoute: string;
  formLayout?: EntityFormLayoutDefinition;
  subforms?: readonly EntitySubformDefinition[];
  factBoxes?: readonly EntityFactBoxDefinition[];
  listActions?: EntityListActionsDefinition;
};

export type EntityDefinition =
  | EditableGridEntityDefinition
  | ListDetailEntityDefinition;

export type EntityRecord = {
  id: string;
  tenant_id: string | null;
  company_id?: string | null;
  is_new?: boolean;
  [key: string]: unknown;
};