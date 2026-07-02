import type { EntityFieldDefinition } from "@/lib/entityFields/types";

export type FieldVisibilityArea = "list" | "form" | "grid";

export type FieldVisibilityPreference = {
  id?: string;
  tenant_id: string;
  company_id: string | null;
  user_id: string | null;
  entity_key: string;
  subform_key: string | null;
  field_key: string;
  area: FieldVisibilityArea;
  hidden: boolean;
};

type FieldVisibilityContext = {
  tenantId: string;
  companyId?: string | null;
  userId: string;
  entityKey: string;
  subformKey?: string | null;
  area: FieldVisibilityArea;
};

type ApplyFieldVisibilityPreferencesParams<
  TField extends EntityFieldDefinition,
> = {
  fields: readonly TField[];
  preferences: readonly FieldVisibilityPreference[];
  context: FieldVisibilityContext;
};

function normalizeNullableValue(value: string | null | undefined) {
  return value ?? null;
}

function preferenceMatchesContext({
  preference,
  context,
}: {
  preference: FieldVisibilityPreference;
  context: FieldVisibilityContext;
}) {
  if (preference.tenant_id !== context.tenantId) {
    return false;
  }

  if (preference.entity_key !== context.entityKey) {
    return false;
  }

  if (preference.area !== context.area) {
    return false;
  }

  if (
    normalizeNullableValue(preference.subform_key) !==
    normalizeNullableValue(context.subformKey)
  ) {
    return false;
  }

  const contextCompanyId = normalizeNullableValue(context.companyId);

  if (
    preference.company_id !== null &&
    preference.company_id !== contextCompanyId
  ) {
    return false;
  }

  if (preference.user_id !== null && preference.user_id !== context.userId) {
    return false;
  }

  return true;
}

function getPreferencePriority({
  preference,
  context,
}: {
  preference: FieldVisibilityPreference;
  context: FieldVisibilityContext;
}) {
  let priority = 0;

  if (preference.company_id && preference.company_id === context.companyId) {
    priority += 10;
  }

  if (preference.user_id && preference.user_id === context.userId) {
    priority += 100;
  }

  return priority;
}

function getFieldPreference({
  field,
  preferences,
  context,
}: {
  field: EntityFieldDefinition;
  preferences: readonly FieldVisibilityPreference[];
  context: FieldVisibilityContext;
}) {
  return preferences
    .filter((preference) => {
      return (
        preference.field_key === field.key &&
        preferenceMatchesContext({
          preference,
          context,
        })
      );
    })
    .sort((leftPreference, rightPreference) => {
      return (
        getPreferencePriority({
          preference: rightPreference,
          context,
        }) -
        getPreferencePriority({
          preference: leftPreference,
          context,
        })
      );
    })[0];
}

export function isFieldHiddenByPreference({
  field,
  preferences,
  context,
}: {
  field: EntityFieldDefinition;
  preferences: readonly FieldVisibilityPreference[];
  context: FieldVisibilityContext;
}) {
  const preference = getFieldPreference({
    field,
    preferences,
    context,
  });

  return preference?.hidden === true;
}

export function applyFieldVisibilityPreferences<
  TField extends EntityFieldDefinition,
>({
  fields,
  preferences,
  context,
}: ApplyFieldVisibilityPreferencesParams<TField>) {
  return fields.filter((field) => {
    return !isFieldHiddenByPreference({
      field,
      preferences,
      context,
    });
  });
}