import {
  getFieldsForForm,
  getFieldsForGrid,
  getFieldsForList,
} from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type {
  EntityDefinition,
  EntitySubformDefinition,
  ListDetailEntityDefinition,
} from "@/lib/entities/core/entityDefinition";
import type { FieldVisibilityArea } from "@/lib/preferences/fieldVisibilityPreferences";

export type FieldVisibilityTarget = {
  area: FieldVisibilityArea;
  subformKey: string | null;
  fields: readonly EntityFieldDefinition[];
};

export function getFieldVisibilityTargetKey({
  area,
  subformKey,
}: {
  area: FieldVisibilityArea;
  subformKey?: string | null;
}) {
  return `${area}:${subformKey ?? ""}`;
}

function getListDetailEntityTargets(entity: ListDetailEntityDefinition) {
  const targets: FieldVisibilityTarget[] = [];

  const listFields = getFieldsForList(entity.fields);

  if (listFields.length > 0) {
    targets.push({
      area: "list",
      subformKey: null,
      fields: listFields,
    });
  }

  const formFields = getFieldsForForm(entity.fields);

  if (formFields.length > 0) {
    targets.push({
      area: "form",
      subformKey: null,
      fields: formFields,
    });
  }

  entity.subforms?.forEach((subform: EntitySubformDefinition) => {
    const gridFields = getFieldsForGrid(subform.fields);

    if (gridFields.length === 0) {
      return;
    }

    targets.push({
      area: "grid",
      subformKey: subform.key,
      fields: gridFields,
    });
  });

  return targets;
}

export function getFieldVisibilityTargets(entity: EntityDefinition) {
  if (entity.pageMode === "editable-grid") {
    const gridFields = getFieldsForGrid(entity.fields);

    return gridFields.length > 0
      ? [
          {
            area: "grid" as const,
            subformKey: null,
            fields: gridFields,
          },
        ]
      : [];
  }

  return getListDetailEntityTargets(entity);
}

export function getFieldVisibilityTarget({
  entity,
  area,
  subformKey,
}: {
  entity: EntityDefinition;
  area: FieldVisibilityArea;
  subformKey?: string | null;
}) {
  const normalizedSubformKey = subformKey ?? null;

  return (
    getFieldVisibilityTargets(entity).find((target) => {
      return (
        target.area === area &&
        (target.subformKey ?? null) === normalizedSubformKey
      );
    }) ?? null
  );
}