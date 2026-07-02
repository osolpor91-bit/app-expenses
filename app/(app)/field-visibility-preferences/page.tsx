import { notFound } from "next/navigation";

import { isTenantAdministratorRole } from "@/lib/auth/tenantRolePermissions";
import {
    getEntityDictionarySection,
    getEntitySubformDictionarySection,
} from "@/lib/entities/core/entityLabels";
import { getRegisteredEntities } from "@/lib/entities/core/entityRegistry";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";
import {
    getFieldVisibilityTargetKey,
    getFieldVisibilityTargets,
} from "@/lib/preferences/fieldVisibilityConfiguration";
import type { FieldVisibilityArea } from "@/lib/preferences/fieldVisibilityPreferences";
import { listFieldVisibilityPreferences } from "@/lib/repositories/fieldVisibilityPreferencesRepository";

import FieldVisibilityPreferencesClient from "./FieldVisibilityPreferencesClient";
import type {
    EntityDefinition,
    ListDetailEntityDefinition,
} from "@/lib/entities/core/entityDefinition";

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getSection(
    source: Record<string, unknown>,
    key: string
): Record<string, unknown> {
    const value = source[key];

    return isRecord(value) ? value : {};
}

function getString(
    source: Record<string, unknown>,
    key: string,
    fallback: string
) {
    const value = source[key];

    return typeof value === "string" ? value : fallback;
}

function isListDetailEntity(
    entity: EntityDefinition
): entity is ListDetailEntityDefinition {
    return entity.pageMode === "list-detail";
}

function getAreaLabel({
    area,
    labels,
}: {
    area: FieldVisibilityArea;
    labels: Record<string, unknown>;
}) {
    return getString(labels, area, area);
}

function getTargetLabel({
    area,
    subformKey,
    subformTitle,
    labels,
}: {
    area: FieldVisibilityArea;
    subformKey: string | null;
    subformTitle?: string;
    labels: Record<string, unknown>;
}) {
    const areaLabel = getAreaLabel({
        area,
        labels,
    });

    if (!subformKey) {
        return areaLabel;
    }

    return `${areaLabel} · ${subformTitle ?? subformKey}`;
}

export default async function FieldVisibilityPreferencesPage() {
    const { supabase, user, tenant, activeCompany, role } =
        await requireCompanyContext();

    if (!isTenantAdministratorRole(role)) {
        notFound();
    }
    const { dict } = await getDictionary();

    const pageLabels = getSection(dict, "fieldVisibilityPreferences");

    const { data, error } = await listFieldVisibilityPreferences({
        supabase,
        tenantId: tenant.id,
        companyId: activeCompany?.id ?? null,
        userId: user.id,
    });

    if (error) {
        throw new Error(`Error leyendo preferencias de campos: ${error.message}`);
    }

    const entities = getRegisteredEntities()
        .map((entity) => {
            const entityLabels = getEntityDictionarySection(entity, dict);
            const targets = getFieldVisibilityTargets(entity);

            return {
                key: entity.key,
                label: getString(entityLabels, "title", entity.key),
                scope: entity.scope,
                targets: targets.map((target) => {
                    const subform =
                        isListDetailEntity(entity) && target.subformKey
                            ? entity.subforms?.find(
                                (currentSubform) => currentSubform.key === target.subformKey
                            ) ?? null
                            : null;

                    const targetLabels = subform
                        ? getEntitySubformDictionarySection(subform, dict)
                        : entityLabels;

                    return {
                        area: target.area,
                        subformKey: target.subformKey,
                        key: getFieldVisibilityTargetKey({
                            area: target.area,
                            subformKey: target.subformKey,
                        }),
                        label: getTargetLabel({
                            area: target.area,
                            subformKey: target.subformKey,
                            subformTitle: subform
                                ? getString(targetLabels, "title", subform.key)
                                : undefined,
                            labels: pageLabels,
                        }),
                        fields: target.fields.map((field) => ({
                            key: field.key,
                            label: getString(targetLabels, field.labelKey, field.key),
                        })),
                    };
                }),
            };
        })
        .filter((entity) => entity.targets.length > 0);

    return (
        <FieldVisibilityPreferencesClient
            entities={entities}
            initialPreferences={data ?? []}
            currentUserId={user.id}
            currentCompanyId={activeCompany?.id ?? null}
            labels={{
                title: getString(
                    pageLabels,
                    "title",
                    "Personalización de campos"
                ),
                description: getString(
                    pageLabels,
                    "description",
                    "Configura qué campos se muestran por entidad, zona y usuario."
                ),
                entity: getString(pageLabels, "entity", "Entidad"),
                area: getString(pageLabels, "area", "Zona"),
                applyTo: getString(pageLabels, "applyTo", "Aplicar a"),
                allUsers: getString(pageLabels, "allUsers", "Todos los usuarios"),
                currentUser: getString(pageLabels, "currentUser", "Solo mi usuario"),
                fields: getString(pageLabels, "fields", "Campos"),
                visible: getString(pageLabels, "visible", "Visible"),
                save: getString(pageLabels, "save", "Guardar"),
                saving: getString(pageLabels, "saving", "Guardando..."),
                saved: getString(pageLabels, "saved", "Preferencias guardadas."),
                saveError: getString(pageLabels, "saveError", "Error al guardar"),
                showAll: getString(pageLabels, "showAll", "Mostrar todos"),
                hideAll: getString(pageLabels, "hideAll", "Ocultar todos"),
                noFields: getString(
                    pageLabels,
                    "noFields",
                    "No hay campos configurables."
                ),
                notAppliedYet: getString(
                    pageLabels,
                    "notAppliedYet",
                    "Esta zona se puede configurar ya, pero se aplicará visualmente en una fase posterior."
                ),
            }}
        />
    );
}