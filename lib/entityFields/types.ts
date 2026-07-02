export type EntityFieldType =
  | "text"
  | "email"
  | "tel"
  | "integer"
  | "boolean"
  | "select"
  | "option"
  | "decimal"
  | "date";

export type EntityFieldNormalization = "uppercase";

export type EntityFieldOptionDefinition = {
  /**
   * Stored value in database.
   * Use "" for the blank/default option.
   */
  value: string;

  /**
   * Translation key inside the entity dictionary section.
   */
  labelKey: string;
};

export type EntityFieldRelationDefinition = {
  /**
   * Entity key registered in entityRegistry.
   * Example: "countries".
   */
  entityKey: string;

  /**
   * Field used in the current row to show the human-readable value.
   * Example: "country_name".
   */
  displayFieldName: string;

  /**
   * Field in the related option used as the saved value.
   * Usually "id".
   */
  optionValueField?: string;

  /**
   * Fields from the related entity used to build the visible label.
   * Example: ["code", "name"] -> "ES - España".
   */
  optionLabelFieldNames: string[];

  /**
   * Supabase relation field returned in selectColumns.
   * Example: "countries" for countries(code, name).
   */
  relationDataFieldName?: string;

  /**
   * Separator used when joining label fields.
   */
  labelSeparator?: string;
  /**
 * When true, list cells for this relation are rendered as links to the
 * related entity card.
 */
  navigable?: boolean;

  /**
 * Optional filter params applied when loading relation options.
 * Uses the related entity filters.
 * Example: { isHeading: "false" } for chart of accounts.
 */
  optionFilterParams?: Record<string, string | string[] | undefined>;
};

export type EntityFieldGridWidth = "xs" | "sm" | "md" | "lg" | "xl";

export type EntityFieldGridAlign = "left" | "center" | "right";

export type EntityFieldGridDefinition = {
  width?: EntityFieldGridWidth;
  align?: EntityFieldGridAlign;
};

export type EntityFieldBusinessRuleTiming =
  | "beforeCreate"
  | "beforeUpdate"
  | "beforeDelete";

export type EntityFieldBusinessRuleParamValue =
  | string
  | number
  | boolean
  | null;

export type EntityFieldBusinessRuleDefinition = {
  key: string;
  timing?: EntityFieldBusinessRuleTiming;
  timings?: readonly EntityFieldBusinessRuleTiming[];
  params?: Record<string, EntityFieldBusinessRuleParamValue>;
};

export type EntityFieldCreateDefaultValueFromRelationDefinition = {
  relationFieldDbName: string;
  sourceFieldDbName: string;
  overwrite?: "always" | "whenEmpty";
};

export type EntityFieldDynamicSelectOptionsDefinition = {
  dependsOnDbName: string;
  source: "purchaseLineSources";
};

export type EntityFieldFormVisibilityOperator =
  | "equals"
  | "notEquals"
  | "isEmpty"
  | "isNotEmpty";

export type EntityFieldFormVisibilityContextValueKey =
  | "activeCompanyCurrencyCode";

export type EntityFieldFormVisibilityDefinition = {
  dependsOnDbName: string;
  operator: EntityFieldFormVisibilityOperator;
  value?: string | number | boolean | null;
  contextValueKey?: EntityFieldFormVisibilityContextValueKey;
  hideWhenDependencyEmpty?: boolean;
};

export type EntityFieldDefinition = {
  key: string;
  dbName: string;
  labelKey: string;
  type: EntityFieldType;

  validation?: string;
  normalization?: EntityFieldNormalization;
  relation?: EntityFieldRelationDefinition;
  dynamicSelectOptions?: EntityFieldDynamicSelectOptionsDefinition;
  newRowDefaultValue?: string | number | boolean | null;
  resetFieldDbNamesOnChange?: readonly string[];

  /**
   * En creación, permite tomar el valor inicial desde la empresa activa.
   * Ejemplo: currency_code en proveedores toma currency_code de companies.
   */
  createDefaultValueFromActiveCompanyDbName?: string;

  /**
   * En creación, permite tomar el valor inicial desde una relación seleccionada.
   * Ejemplo: currency_code en facturas portal toma currency_code del proveedor.
   */
  createDefaultValueFromRelation?: {
    relationFieldDbName: string;
    sourceFieldDbName: string;
    overwrite?: "always" | "whenEmpty";
  };

  grid?: EntityFieldGridDefinition;

  /**
   * Business rules executed by the generic entity service.
   * Similar to a field Validate in Business Central.
   */
  businessRules?: readonly EntityFieldBusinessRuleDefinition[];

  /**
   * Fixed options for fields with type === "option".
   */
  options?: readonly EntityFieldOptionDefinition[];

  required?: boolean;
  editable?: boolean;

  /**
   * Marks a field whose value is derived from other data.
   * Example: a header total calculated from invoice lines.
   */
  calculated?: boolean;

  /**
 * Conditional visibility in entity forms.
 * This is evaluated in the client form using current form values.
 */
  formVisibility?: EntityFieldFormVisibilityDefinition;

  decimalScale?: number;

  showInList?: boolean;
  showInForm?: boolean;
  showInGrid?: boolean;
  showInFactBox?: boolean;

  formColSpan?: "full";
};
