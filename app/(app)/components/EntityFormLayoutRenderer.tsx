"use client";

import type { ReactNode } from "react";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type {
  EntityFormFieldPlacement,
  EntityFormLayoutDefinition,
  EntityFormSectionDefinition,
} from "@/lib/entities/core/entityDefinition";

type EntityFormLayoutRendererProps = {
  fields: readonly EntityFieldDefinition[];
  layout?: EntityFormLayoutDefinition;
  formLayoutLabels?: Record<string, string>;
  renderField: (
    field: EntityFieldDefinition,
    placement?: EntityFormFieldPlacement
  ) => ReactNode;
};

function getGridClassName(columns = 2) {
  if (columns === 1) {
    return "grid gap-5";
  }

  if (columns === 3) {
    return "grid gap-5 md:grid-cols-2 xl:grid-cols-3";
  }

  if (columns === 4) {
    return "grid gap-5 md:grid-cols-2 xl:grid-cols-4";
  }

  return "grid gap-5 md:grid-cols-2";
}

function normalizePlacement(
  placement: string | EntityFormFieldPlacement
): EntityFormFieldPlacement {
  if (typeof placement === "string") {
    return {
      field: placement,
    };
  }

  return placement;
}

function getSectionLabel({
  section,
  formLayoutLabels,
}: {
  section: EntityFormSectionDefinition;
  formLayoutLabels: Record<string, string>;
}) {
  if (!section.labelKey) {
    return "";
  }

  return formLayoutLabels[section.labelKey] ?? section.labelKey;
}

export default function EntityFormLayoutRenderer({
  fields,
  layout,
  formLayoutLabels = {},
  renderField,
}: EntityFormLayoutRendererProps) {
  const fieldByDbName = new Map(fields.map((field) => [field.dbName, field]));

  if (!layout) {
    return (
      <div className={getGridClassName(2)}>
        {fields.map((field) => renderField(field))}
      </div>
    );
  }

  const renderedFieldNames = new Set<string>();

  const renderedSections = layout.sections.map((section) => {
    const sectionLabel = getSectionLabel({
      section,
      formLayoutLabels,
    });

    const sectionFields = section.fields
      .map((fieldPlacement) => normalizePlacement(fieldPlacement))
      .map((placement) => ({
        placement,
        field: fieldByDbName.get(placement.field),
      }))
      .filter(
        (
          item
        ): item is {
          placement: EntityFormFieldPlacement;
          field: EntityFieldDefinition;
        } => Boolean(item.field)
      );

    sectionFields.forEach(({ field }) => {
      renderedFieldNames.add(field.dbName);
    });

    if (sectionFields.length === 0) {
      return null;
    }

    return (
      <section
        key={section.key}
        className="rounded-xl border border-app bg-app-soft p-4"
      >
        {sectionLabel && (
          <h2 className="mb-4 text-sm font-semibold text-primary-app">
            {sectionLabel}
          </h2>
        )}

        <div className={getGridClassName(section.columns ?? 2)}>
          {sectionFields.map(({ field, placement }) =>
            renderField(field, placement)
          )}
        </div>
      </section>
    );
  });

  const unassignedFields = fields.filter(
    (field) => !renderedFieldNames.has(field.dbName)
  );

  return (
    <div className="space-y-5">
      {renderedSections}

      {unassignedFields.length > 0 && (
        <div className={getGridClassName(2)}>
          {unassignedFields.map((field) => renderField(field))}
        </div>
      )}
    </div>
  );
}