"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getEntityDefinition } from "@/lib/entities/core/entityRegistry";
import {
    getFieldVisibilityTarget,
    type FieldVisibilityTarget,
} from "@/lib/preferences/fieldVisibilityConfiguration";
import {
    applyFieldVisibilityPreferences,
    type FieldVisibilityArea,
    type FieldVisibilityPreference,
} from "@/lib/preferences/fieldVisibilityPreferences";
import {
    listFieldVisibilityPreferences,
    replaceFieldVisibilityPreferences,
} from "@/lib/repositories/fieldVisibilityPreferencesRepository";
import {
    entityOperationError,
    entityOperationOk,
    type EntityOperationResult,
} from "@/lib/services/entityService";

type SaveFieldVisibilityPreferencesInput = {
    entityKey: string;
    area: FieldVisibilityArea;
    subformKey: string | null;
    scope: "all" | "user";
    visibleFieldKeys: string[];
};

function getTargetCompanyId({
    entityScope,
    activeCompanyId,
}: {
    entityScope: "tenant" | "company";
    activeCompanyId: string | null;
}) {
    if (entityScope === "tenant") {
        return null;
    }

    return activeCompanyId;
}

function normalizeVisibleFieldKeys({
    visibleFieldKeys,
    target,
}: {
    visibleFieldKeys: string[];
    target: FieldVisibilityTarget;
}) {
    const allowedFieldKeys = new Set(target.fields.map((field) => field.key));

    return new Set(
        visibleFieldKeys.filter((fieldKey) => allowedFieldKeys.has(fieldKey))
    );
}

function buildAllUsersPreferenceRows({
    tenantId,
    companyId,
    entityKey,
    subformKey,
    area,
    target,
    visibleFieldKeys,
}: {
    tenantId: string;
    companyId: string | null;
    entityKey: string;
    subformKey: string | null;
    area: FieldVisibilityArea;
    target: FieldVisibilityTarget;
    visibleFieldKeys: Set<string>;
}): Omit<FieldVisibilityPreference, "id">[] {
    return target.fields
        .filter((field) => !visibleFieldKeys.has(field.key))
        .map((field) => ({
            tenant_id: tenantId,
            company_id: companyId,
            user_id: null,
            entity_key: entityKey,
            subform_key: subformKey,
            field_key: field.key,
            area,
            hidden: true,
        }));
}

function getAllUsersVisibleFieldKeys({
    tenantId,
    companyId,
    userId,
    entityKey,
    subformKey,
    area,
    target,
    preferences,
}: {
    tenantId: string;
    companyId: string | null;
    userId: string;
    entityKey: string;
    subformKey: string | null;
    area: FieldVisibilityArea;
    target: FieldVisibilityTarget;
    preferences: readonly FieldVisibilityPreference[];
}) {
    const allUsersPreferences = preferences.filter(
        (preference) => preference.user_id === null
    );

    const visibleFields = applyFieldVisibilityPreferences({
        fields: target.fields,
        preferences: allUsersPreferences,
        context: {
            tenantId,
            companyId,
            userId,
            entityKey,
            subformKey,
            area,
        },
    });

    return new Set(visibleFields.map((field) => field.key));
}

function buildUserPreferenceRows({
    tenantId,
    companyId,
    userId,
    entityKey,
    subformKey,
    area,
    target,
    visibleFieldKeys,
    allUsersVisibleFieldKeys,
}: {
    tenantId: string;
    companyId: string | null;
    userId: string;
    entityKey: string;
    subformKey: string | null;
    area: FieldVisibilityArea;
    target: FieldVisibilityTarget;
    visibleFieldKeys: Set<string>;
    allUsersVisibleFieldKeys: Set<string>;
}): Omit<FieldVisibilityPreference, "id">[] {
    const rows: Omit<FieldVisibilityPreference, "id">[] = [];

    target.fields.forEach((field) => {
        const desiredVisible = visibleFieldKeys.has(field.key);
        const allUsersVisible = allUsersVisibleFieldKeys.has(field.key);

        if (desiredVisible === allUsersVisible) {
            return;
        }

        rows.push({
            tenant_id: tenantId,
            company_id: companyId,
            user_id: userId,
            entity_key: entityKey,
            subform_key: subformKey,
            field_key: field.key,
            area,
            hidden: !desiredVisible,
        });
    });

    return rows;
}

export async function saveFieldVisibilityPreferencesAction({
    entityKey,
    area,
    subformKey,
    scope,
    visibleFieldKeys,
}: SaveFieldVisibilityPreferencesInput): Promise<
    EntityOperationResult<{ preferences: FieldVisibilityPreference[] }>
> {
    const { supabase, user, tenant, activeCompany } =
        await requireCompanyContext();

    const entity = getEntityDefinition(entityKey);

    if (!entity) {
        return entityOperationError(`La entidad ${entityKey} no está registrada.`);
    }

    const companyId = getTargetCompanyId({
        entityScope: entity.scope,
        activeCompanyId: activeCompany?.id ?? null,
    });

    if (entity.scope === "company" && !companyId) {
        return entityOperationError(
            "Esta entidad requiere una empresa activa para guardar preferencias."
        );
    }

    const target = getFieldVisibilityTarget({
        entity,
        area,
        subformKey,
    });

    if (!target) {
        return entityOperationError(
            `La zona ${area} no está disponible para ${entity.key}.`
        );
    }

    const normalizedVisibleFieldKeys = normalizeVisibleFieldKeys({
        visibleFieldKeys,
        target,
    });

    const preferencesResult = await listFieldVisibilityPreferences({
        supabase,
        tenantId: tenant.id,
        companyId,
        userId: user.id,
        entityKey,
        area,
    });

    if (preferencesResult.error) {
        return entityOperationError(preferencesResult.error.message);
    }

    const preferences = preferencesResult.data ?? [];

    const rows =
        scope === "all"
            ? buildAllUsersPreferenceRows({
                tenantId: tenant.id,
                companyId,
                entityKey,
                subformKey,
                area,
                target,
                visibleFieldKeys: normalizedVisibleFieldKeys,
            })
            : buildUserPreferenceRows({
                tenantId: tenant.id,
                companyId,
                userId: user.id,
                entityKey,
                subformKey,
                area,
                target,
                visibleFieldKeys: normalizedVisibleFieldKeys,
                allUsersVisibleFieldKeys: getAllUsersVisibleFieldKeys({
                    tenantId: tenant.id,
                    companyId,
                    userId: user.id,
                    entityKey,
                    subformKey,
                    area,
                    target,
                    preferences,
                }),
            });

    const replaceResult = await replaceFieldVisibilityPreferences({
        supabase,
        tenantId: tenant.id,
        companyId,
        userId: scope === "user" ? user.id : null,
        entityKey,
        subformKey,
        area,
        rows,
    });

    if (replaceResult.error) {
        return entityOperationError(replaceResult.error.message);
    }

    const refreshedPreferencesResult = await listFieldVisibilityPreferences({
        supabase,
        tenantId: tenant.id,
        companyId,
        userId: user.id,
    });

    if (refreshedPreferencesResult.error) {
        return entityOperationError(refreshedPreferencesResult.error.message);
    }

    revalidatePath("/field-visibility-preferences");
    revalidatePath(entity.route);

    return entityOperationOk({
        preferences: refreshedPreferencesResult.data ?? [],
    });
}
