"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { saveFieldVisibilityPreferencesAction } from "./actions";
import type {
  FieldVisibilityArea,
  FieldVisibilityPreference,
} from "@/lib/preferences/fieldVisibilityPreferences";

type PreferenceScope = "all" | "user";

type FieldOption = {
  key: string;
  label: string;
};

type TargetOption = {
  area: FieldVisibilityArea;
  subformKey: string | null;
  key: string;
  label: string;
  fields: FieldOption[];
};

type EntityOption = {
  key: string;
  label: string;
  scope: "tenant" | "company";
  targets: TargetOption[];
};

type Labels = {
  title: string;
  description: string;
  entity: string;
  area: string;
  applyTo: string;
  allUsers: string;
  currentUser: string;
  fields: string;
  visible: string;
  save: string;
  saving: string;
  saved: string;
  saveError: string;
  showAll: string;
  hideAll: string;
  noFields: string;
  notAppliedYet: string;
};

type FieldVisibilityPreferencesClientProps = {
  entities: EntityOption[];
  initialPreferences: FieldVisibilityPreference[];
  currentUserId: string;
  currentCompanyId: string | null;
  labels: Labels;
};

function getPreferenceTargetKey(preference: FieldVisibilityPreference) {
  return `${preference.area}:${preference.subform_key ?? ""}`;
}

function getPreferencePriority({
  preference,
  currentCompanyId,
}: {
  preference: FieldVisibilityPreference;
  currentCompanyId: string | null;
}) {
  return preference.company_id && preference.company_id === currentCompanyId
    ? 10
    : 0;
}

function findPreference({
  preferences,
  entityKey,
  targetKey,
  fieldKey,
  userId,
  currentCompanyId,
}: {
  preferences: readonly FieldVisibilityPreference[];
  entityKey: string;
  targetKey: string;
  fieldKey: string;
  userId: string | null;
  currentCompanyId: string | null;
}) {
  return preferences
    .filter((preference) => {
      return (
        preference.entity_key === entityKey &&
        getPreferenceTargetKey(preference) === targetKey &&
        preference.field_key === fieldKey &&
        preference.user_id === userId &&
        (preference.company_id === null ||
          preference.company_id === currentCompanyId)
      );
    })
    .sort((leftPreference, rightPreference) => {
      return (
        getPreferencePriority({
          preference: rightPreference,
          currentCompanyId,
        }) -
        getPreferencePriority({
          preference: leftPreference,
          currentCompanyId,
        })
      );
    })[0];
}

function getAllUsersVisibleFieldKeys({
  preferences,
  entity,
  target,
  currentCompanyId,
}: {
  preferences: readonly FieldVisibilityPreference[];
  entity: EntityOption;
  target: TargetOption;
  currentCompanyId: string | null;
}) {
  return target.fields
    .filter((field) => {
      const preference = findPreference({
        preferences,
        entityKey: entity.key,
        targetKey: target.key,
        fieldKey: field.key,
        userId: null,
        currentCompanyId,
      });

      return preference ? !preference.hidden : true;
    })
    .map((field) => field.key);
}

function getCurrentUserVisibleFieldKeys({
  preferences,
  entity,
  target,
  currentUserId,
  currentCompanyId,
}: {
  preferences: readonly FieldVisibilityPreference[];
  entity: EntityOption;
  target: TargetOption;
  currentUserId: string;
  currentCompanyId: string | null;
}) {
  const allUsersVisibleFieldKeys = new Set(
    getAllUsersVisibleFieldKeys({
      preferences,
      entity,
      target,
      currentCompanyId,
    })
  );

  return target.fields
    .filter((field) => {
      const userPreference = findPreference({
        preferences,
        entityKey: entity.key,
        targetKey: target.key,
        fieldKey: field.key,
        userId: currentUserId,
        currentCompanyId,
      });

      if (userPreference) {
        return !userPreference.hidden;
      }

      return allUsersVisibleFieldKeys.has(field.key);
    })
    .map((field) => field.key);
}

function getVisibleFieldKeys({
  preferences,
  entity,
  target,
  scope,
  currentUserId,
  currentCompanyId,
}: {
  preferences: readonly FieldVisibilityPreference[];
  entity: EntityOption;
  target: TargetOption;
  scope: PreferenceScope;
  currentUserId: string;
  currentCompanyId: string | null;
}) {
  if (scope === "all") {
    return getAllUsersVisibleFieldKeys({
      preferences,
      entity,
      target,
      currentCompanyId,
    });
  }

  return getCurrentUserVisibleFieldKeys({
    preferences,
    entity,
    target,
    currentUserId,
    currentCompanyId,
  });
}

export default function FieldVisibilityPreferencesClient({
  entities,
  initialPreferences,
  currentUserId,
  currentCompanyId,
  labels,
}: FieldVisibilityPreferencesClientProps) {
  const firstEntity = entities[0] ?? null;
  const firstTarget = firstEntity?.targets[0] ?? null;

  const [preferences, setPreferences] =
    useState<FieldVisibilityPreference[]>(initialPreferences);
  const [selectedEntityKey, setSelectedEntityKey] = useState(
    firstEntity?.key ?? ""
  );
  const [selectedTargetKey, setSelectedTargetKey] = useState(
    firstTarget?.key ?? ""
  );
  const [scope, setScope] = useState<PreferenceScope>("all");
  const [visibleFieldKeys, setVisibleFieldKeys] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedEntity = useMemo(() => {
    return entities.find((entity) => entity.key === selectedEntityKey) ?? null;
  }, [entities, selectedEntityKey]);

  const selectedTarget = useMemo(() => {
    return (
      selectedEntity?.targets.find((target) => target.key === selectedTargetKey) ??
      selectedEntity?.targets[0] ??
      null
    );
  }, [selectedEntity, selectedTargetKey]);

  useEffect(() => {
    if (!selectedEntity) {
      return;
    }

    const targetExists = selectedEntity.targets.some(
      (target) => target.key === selectedTargetKey
    );

    if (!targetExists) {
      setSelectedTargetKey(selectedEntity.targets[0]?.key ?? "");
    }
  }, [selectedEntity, selectedTargetKey]);

  useEffect(() => {
    if (!selectedEntity || !selectedTarget) {
      setVisibleFieldKeys([]);
      return;
    }

    setVisibleFieldKeys(
      getVisibleFieldKeys({
        preferences,
        entity: selectedEntity,
        target: selectedTarget,
        scope,
        currentUserId,
        currentCompanyId,
      })
    );
  }, [
    preferences,
    selectedEntity,
    selectedTarget,
    scope,
    currentUserId,
    currentCompanyId,
  ]);

  function toggleField(fieldKey: string, checked: boolean) {
    setVisibleFieldKeys((currentFieldKeys) => {
      if (checked) {
        return Array.from(new Set([...currentFieldKeys, fieldKey]));
      }

      return currentFieldKeys.filter(
        (currentFieldKey) => currentFieldKey !== fieldKey
      );
    });

    setMessage(null);
  }

  function showAllFields() {
    if (!selectedTarget) {
      return;
    }

    setVisibleFieldKeys(selectedTarget.fields.map((field) => field.key));
    setMessage(null);
  }

  function hideAllFields() {
    setVisibleFieldKeys([]);
    setMessage(null);
  }

  function savePreferences() {
    if (!selectedEntity || !selectedTarget) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result = await saveFieldVisibilityPreferencesAction({
        entityKey: selectedEntity.key,
        area: selectedTarget.area,
        subformKey: selectedTarget.subformKey,
        scope,
        visibleFieldKeys,
      });

      if (!result.ok) {
        setMessage(`${labels.saveError}: ${result.error}`);
        return;
      }

      setPreferences(result.data.preferences);
      setMessage(labels.saved);
    });
  }

  if (entities.length === 0) {
    return (
      <section className="card-app-soft p-5">
        <p className="text-sm text-app-muted">{labels.noFields}</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary-app sm:text-3xl">
          {labels.title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-app-muted">
          {labels.description}
        </p>
      </div>

      <section className="card-app-soft space-y-4 p-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <label className="text-xs font-medium text-app-muted">
            {labels.entity}
            <select
              className="input-app mt-1 w-full px-3 py-2 text-sm"
              value={selectedEntityKey}
              onChange={(event) => {
                setSelectedEntityKey(event.target.value);
                setMessage(null);
              }}
            >
              {entities.map((entity) => (
                <option key={entity.key} value={entity.key}>
                  {entity.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-app-muted">
            {labels.area}
            <select
              className="input-app mt-1 w-full px-3 py-2 text-sm"
              value={selectedTargetKey}
              onChange={(event) => {
                setSelectedTargetKey(event.target.value);
                setMessage(null);
              }}
            >
              {selectedEntity?.targets.map((target) => (
                <option key={target.key} value={target.key}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-app-muted">
            {labels.applyTo}
            <select
              className="input-app mt-1 w-full px-3 py-2 text-sm"
              value={scope}
              onChange={(event) => {
                setScope(event.target.value as PreferenceScope);
                setMessage(null);
              }}
            >
              <option value="all">{labels.allUsers}</option>
              <option value="user">{labels.currentUser}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card-app-soft p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-primary-app">
            {labels.fields}
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary-app px-3 py-2 text-xs"
              onClick={showAllFields}
            >
              {labels.showAll}
            </button>

            <button
              type="button"
              className="btn-secondary-app px-3 py-2 text-xs"
              onClick={hideAllFields}
            >
              {labels.hideAll}
            </button>
          </div>
        </div>

        {selectedTarget && selectedTarget.fields.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {selectedTarget.fields.map((field) => (
              <label
                key={field.key}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-app bg-app px-3 py-2 text-sm hover:bg-app-soft"
              >
                <input
                  type="checkbox"
                  checked={visibleFieldKeys.includes(field.key)}
                  onChange={(event) =>
                    toggleField(field.key, event.target.checked)
                  }
                />
                <span>{field.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-app-muted">{labels.noFields}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            className="btn-primary-app px-5 py-2 text-sm disabled:opacity-60"
            onClick={savePreferences}
          >
            {isPending ? labels.saving : labels.save}
          </button>

          {message && <p className="text-sm text-app-muted">{message}</p>}
        </div>
      </section>
    </section>
  );
}