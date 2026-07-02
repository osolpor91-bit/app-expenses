"use server";

import {
    deleteAttachmentFile,
    storeAttachmentFile,
} from "@/lib/attachments/attachmentStorage";
import { requireTenant } from "@/lib/auth/requireTenant";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import type {
    EntityDocumentFactBoxDefinition,
    EntityScope,
    ListDetailEntityDefinition,
} from "@/lib/entities/core/entityDefinition";
import { getEntityDefinition } from "@/lib/entities/core/entityRegistry";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
    entityOperationError,
    entityOperationOk,
    type EntityOperationResult,
} from "@/lib/services/entityService";

type EntityDocumentFactBoxInput = {
    entityKey: string;
    recordId: string;
    factBoxKey?: string;
};

type EntityDocumentFactBoxDocument = {
    id: string;
    fileName: string;
    contentType: string | null;
    sizeBytes: number | null;
    storageProvider: string;
    openUrl: string | null;
    downloadUrl: string | null;
    externalUrl: string | null;
};

type EntityDocumentFactBoxResult = {
    documents: EntityDocumentFactBoxDocument[];
};

type UploadEntityDocumentFactBoxResult = {
    id: string;
};

type EntityDocumentFactBoxContext = {
    tenantId: string;
    companyId?: string | null;
    userId: string;
};

type GenericSupabaseError = {
    message?: string;
};
const maxAttachmentFileSizeBytes = 10 * 1024 * 1024;

function getStringValue(source: Record<string, unknown>, key?: string) {
    if (!key) {
        return null;
    }

    const value = source[key];

    return typeof value === "string" ? value : null;
}

function getNumberValue(source: Record<string, unknown>, key?: string) {
    if (!key) {
        return null;
    }

    const value = source[key];

    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
}


function validateAttachmentFile(file: File) {
    if (file.size <= 0) {
        return "El archivo adjunto está vacío.";
    }

    if (file.size > maxAttachmentFileSizeBytes) {
        return "El archivo no puede superar los 10 MB.";
    }

    return null;
}

async function getActionContext(
    scope: EntityScope
): Promise<EntityDocumentFactBoxContext> {
    if (scope === "company") {
        const { tenant, activeCompany, user } = await requireCompanyContext();

        if (!activeCompany) {
            throw new Error("Esta entidad requiere una empresa activa.");
        }

        return {
            tenantId: tenant.id,
            companyId: activeCompany.id,
            userId: user.id,
        };
    }

    const { tenant, user } = await requireTenant();

    return {
        tenantId: tenant.id,
        userId: user.id,
    };
}

function applyParentScope({
    query,
    entity,
    context,
}: {
    query: any;
    entity: ListDetailEntityDefinition;
    context: EntityDocumentFactBoxContext;
}) {
    let scopedQuery = query.eq("tenant_id", context.tenantId);

    if (entity.scope === "company") {
        scopedQuery = scopedQuery.eq("company_id", context.companyId);
    }

    return scopedQuery;
}

function applyDocumentScope({
    query,
    entity,
    context,
}: {
    query: any;
    entity: ListDetailEntityDefinition;
    context: EntityDocumentFactBoxContext;
}) {
    let scopedQuery = query.eq("tenant_id", context.tenantId);

    if (entity.scope === "company") {
        scopedQuery = scopedQuery.eq("company_id", context.companyId);
    }

    return scopedQuery;
}

function getParentRecordSelectColumns(entity: ListDetailEntityDefinition) {
    return entity.scope === "company" ? "id, tenant_id, company_id" : "id, tenant_id";
}

async function ensureParentRecordExists({
    adminSupabase,
    entity,
    context,
    recordId,
}: {
    adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
    entity: ListDetailEntityDefinition;
    context: EntityDocumentFactBoxContext;
    recordId: string;
}) {
    let query = adminSupabase
        .from(entity.table)
        .select(getParentRecordSelectColumns(entity))
        .eq("id", recordId);

    query = applyParentScope({
        query,
        entity,
        context,
    });

    const { data, error } = (await query.maybeSingle()) as {
        data: Record<string, unknown> | null;
        error: GenericSupabaseError | null;
    };

    if (error || !data) {
        return false;
    }

    return true;
}

function getDocumentSelectColumns(config: EntityDocumentFactBoxDefinition) {
    return [
        "id",
        "tenant_id",
        "company_id",
        config.entityTableDbName,
        config.parentIdDbName,
        config.storageProviderDbName,
        config.supabaseBucketDbName,
        config.supabasePathDbName,
        config.sharepointWebUrlDbName,
        config.originalFileNameDbName,
        config.contentTypeDbName,
        config.sizeBytesDbName,
        config.orderBy?.column,
    ]
        .filter(Boolean)
        .join(", ");
}

async function getDocumentRecords({
    adminSupabase,
    entity,
    config,
    context,
    recordId,
}: {
    adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
    entity: ListDetailEntityDefinition;
    config: EntityDocumentFactBoxDefinition;
    context: EntityDocumentFactBoxContext;
    recordId: string;
}) {
    let query = adminSupabase
        .from(config.table)
        .select(getDocumentSelectColumns(config))
        .eq(config.parentIdDbName, recordId)
        .limit(50);

    if (config.entityTableDbName) {
        query = query.eq(config.entityTableDbName, entity.table);
    }

    query = applyDocumentScope({
        query,
        entity,
        context,
    });

    if (config.orderBy) {
        query = query.order(config.orderBy.column, {
            ascending: config.orderBy.ascending ?? true,
        });
    }

    const { data, error } = (await query) as {
        data: Record<string, unknown>[] | null;
        error: GenericSupabaseError | null;
    };

    if (error) {
        throw new Error(error.message ?? "No se pudieron leer los adjuntos.");
    }

    return data ?? [];
}

async function buildSupabaseStorageUrls({
    adminSupabase,
    bucket,
    path,
    fileName,
}: {
    adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
    bucket: string;
    path: string;
    fileName: string;
}) {
    const { data: openData, error: openError } = await adminSupabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);

    if (openError || !openData?.signedUrl) {
        throw new Error(openError?.message ?? "No se pudo generar el enlace de vista.");
    }

    const { data: downloadData, error: downloadError } = await adminSupabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60, {
            download: fileName,
        });

    if (downloadError || !downloadData?.signedUrl) {
        throw new Error(downloadError?.message ?? "No se pudo generar la descarga.");
    }

    return {
        openUrl: openData.signedUrl,
        downloadUrl: downloadData.signedUrl,
    };
}

function getDocumentFactBoxConfig({
    entity,
    factBoxKey,
}: {
    entity: ListDetailEntityDefinition;
    factBoxKey?: string;
}) {
    const documentFactBoxes = (entity.factBoxes ?? []).filter(
        (factBox): factBox is EntityDocumentFactBoxDefinition =>
            factBox.type === "document"
    );

    if (factBoxKey) {
        return (
            documentFactBoxes.find((factBox) => factBox.key === factBoxKey) ?? null
        );
    }

    return documentFactBoxes[0] ?? null;
}

async function buildDocumentResult({
    adminSupabase,
    config,
    documentRecord,
}: {
    adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
    config: EntityDocumentFactBoxDefinition;
    documentRecord: Record<string, unknown>;
}): Promise<EntityDocumentFactBoxDocument> {
    const id = getStringValue(documentRecord, "id") ?? "";
    const storageProvider = getStringValue(
        documentRecord,
        config.storageProviderDbName
    );

    const fileName =
        getStringValue(documentRecord, config.originalFileNameDbName) ?? "documento";

    const contentType = getStringValue(documentRecord, config.contentTypeDbName);
    const sizeBytes = getNumberValue(documentRecord, config.sizeBytesDbName);

    if (storageProvider === "supabase_storage") {
        const bucket = getStringValue(documentRecord, config.supabaseBucketDbName);
        const path = getStringValue(documentRecord, config.supabasePathDbName);

        if (!bucket || !path) {
            throw new Error("El adjunto no tiene ruta de almacenamiento.");
        }

        const { openUrl, downloadUrl } = await buildSupabaseStorageUrls({
            adminSupabase,
            bucket,
            path,
            fileName,
        });

        return {
            id,
            fileName,
            contentType,
            sizeBytes,
            storageProvider,
            openUrl,
            downloadUrl,
            externalUrl: null,
        };
    }

    if (storageProvider === "sharepoint") {
        const externalUrl = getStringValue(
            documentRecord,
            config.sharepointWebUrlDbName
        );

        return {
            id,
            fileName,
            contentType,
            sizeBytes,
            storageProvider,
            openUrl: externalUrl,
            downloadUrl: externalUrl,
            externalUrl,
        };
    }

    throw new Error("Proveedor de almacenamiento no soportado.");
}

async function getAttachmentStorageProvider({
    adminSupabase,
    entity,
    context,
    recordId,
}: {
    adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
    entity: ListDetailEntityDefinition;
    context: EntityDocumentFactBoxContext;
    recordId: string;
}) {
    const companyId =
        entity.scope === "company"
            ? context.companyId
            : entity.table === "companies"
                ? recordId
                : null;

    if (!companyId) {
        return "supabase_storage";
    }

    const { data, error } = (await adminSupabase
        .from("companies")
        .select("attachment_storage_provider")
        .eq("id", companyId)
        .eq("tenant_id", context.tenantId)
        .maybeSingle()) as {
            data: { attachment_storage_provider: string | null } | null;
            error: GenericSupabaseError | null;
        };

    if (error) {
        throw new Error(
            error.message ?? "No se pudo leer la configuración documental."
        );
    }

    return data?.attachment_storage_provider ?? "supabase_storage";
}

function buildAttachmentInsertPayload({
    entity,
    config,
    context,
    recordId,
    storageProvider,
    storageBucket,
    filePath,
    externalUrl,
    file,
}: {
    entity: ListDetailEntityDefinition;
    config: EntityDocumentFactBoxDefinition;
    context: EntityDocumentFactBoxContext;
    recordId: string;
    storageProvider: string;
    storageBucket: string | null;
    filePath: string | null;
    externalUrl: string | null;
    file: File;
}) {
    const payload: Record<string, unknown> = {
        tenant_id: context.tenantId,
        created_by: context.userId,
    };

    if (entity.scope === "company") {
        payload.company_id = context.companyId;
    }

    if (config.entityTableDbName) {
        payload[config.entityTableDbName] = entity.table;
    }

    payload[config.parentIdDbName] = recordId;
    payload[config.storageProviderDbName] = storageProvider;

    if (config.supabaseBucketDbName) {
        payload[config.supabaseBucketDbName] = storageBucket;
    }

    if (config.supabasePathDbName) {
        payload[config.supabasePathDbName] = filePath;
    }

    if (config.sharepointWebUrlDbName) {
        payload[config.sharepointWebUrlDbName] = externalUrl;
    }

    if (config.originalFileNameDbName) {
        payload[config.originalFileNameDbName] = file.name;
    }

    if (config.contentTypeDbName) {
        payload[config.contentTypeDbName] = file.type || null;
    }

    if (config.sizeBytesDbName) {
        payload[config.sizeBytesDbName] = file.size;
    }

    return payload;
}

export async function getEntityDocumentFactBoxAction({
    entityKey,
    recordId,
    factBoxKey,
}: EntityDocumentFactBoxInput): Promise<
    EntityOperationResult<EntityDocumentFactBoxResult>
> {
    const entityDefinition = getEntityDefinition(entityKey);

    if (!entityDefinition || entityDefinition.pageMode !== "list-detail") {
        return entityOperationError("La entidad no admite factbox documental.");
    }

    const entity = entityDefinition as ListDetailEntityDefinition;
    const config = getDocumentFactBoxConfig({
        entity,
        factBoxKey,
    });

    if (!config) {
        return entityOperationError(
            "La entidad no tiene factbox documental configurado."
        );
    }

    const context = await getActionContext(entity.scope);
    const adminSupabase = createSupabaseAdminClient();

    const parentExists = await ensureParentRecordExists({
        adminSupabase,
        entity,
        context,
        recordId,
    });

    if (!parentExists) {
        return entityOperationError("No se ha encontrado el registro.");
    }

    try {
        const documentRecords = await getDocumentRecords({
            adminSupabase,
            entity,
            config,
            context,
            recordId,
        });

        const documents = await Promise.all(
            documentRecords.map((documentRecord) =>
                buildDocumentResult({
                    adminSupabase,
                    config,
                    documentRecord,
                })
            )
        );

        return entityOperationOk({
            documents,
        });
    } catch (error) {
        return entityOperationError(
            error instanceof Error
                ? error.message
                : "No se pudieron cargar los adjuntos."
        );
    }
}

export async function uploadEntityDocumentFactBoxAction(
    {
        entityKey,
        recordId,
        factBoxKey,
    }: EntityDocumentFactBoxInput,
    formData: FormData
): Promise<EntityOperationResult<UploadEntityDocumentFactBoxResult>> {
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return entityOperationError("Debes seleccionar un archivo.");
    }

    const validationError = validateAttachmentFile(file);

    if (validationError) {
        return entityOperationError(validationError);
    }

    const entityDefinition = getEntityDefinition(entityKey);

    if (!entityDefinition || entityDefinition.pageMode !== "list-detail") {
        return entityOperationError("La entidad no admite adjuntos.");
    }

    const entity = entityDefinition as ListDetailEntityDefinition;
    const config = getDocumentFactBoxConfig({
        entity,
        factBoxKey,
    });

    if (!config) {
        return entityOperationError(
            "La entidad no tiene adjuntos configurados."
        );
    }

    const context = await getActionContext(entity.scope);
    const adminSupabase = createSupabaseAdminClient();

    const parentExists = await ensureParentRecordExists({
        adminSupabase,
        entity,
        context,
        recordId,
    });

    if (!parentExists) {
        return entityOperationError("No se ha encontrado el registro.");
    }

    try {
        const attachmentStorageProvider = await getAttachmentStorageProvider({
            adminSupabase,
            entity,
            context,
            recordId,
        });

        const storedFile = await storeAttachmentFile({
            supabase: adminSupabase,
            provider: attachmentStorageProvider,
            file,
            fileName: file.name,
            pathParts: [
                context.tenantId,
                context.companyId ?? "tenant",
                entity.table,
                recordId,
            ],
        });

        const payload = buildAttachmentInsertPayload({
            entity,
            config,
            context,
            recordId,
            storageProvider: storedFile.storageProvider,
            storageBucket: storedFile.storageBucket,
            filePath: storedFile.filePath,
            externalUrl: storedFile.externalUrl,
            file,
        });

        const { data, error } = (await adminSupabase
            .from(config.table)
            .insert(payload)
            .select("id")
            .single()) as {
                data: { id: string } | null;
                error: GenericSupabaseError | null;
            };

        if (error || !data) {
            throw new Error(error?.message ?? "No se pudo registrar el adjunto.");
        }

        return entityOperationOk({
            id: data.id,
        });
    } catch (error) {
        return entityOperationError(
            error instanceof Error
                ? error.message
                : "No se pudo cargar el adjunto."
        );
    }
}

export async function deleteEntityDocumentFactBoxAction({
    entityKey,
    recordId,
    factBoxKey,
    documentId,
}: EntityDocumentFactBoxInput & {
    documentId: string;
}): Promise<EntityOperationResult<{ id: string }>> {
    if (!documentId) {
        return entityOperationError("No se ha indicado el adjunto a eliminar.");
    }

    const entityDefinition = getEntityDefinition(entityKey);

    if (!entityDefinition || entityDefinition.pageMode !== "list-detail") {
        return entityOperationError("La entidad no admite adjuntos.");
    }

    const entity = entityDefinition as ListDetailEntityDefinition;
    const config = getDocumentFactBoxConfig({
        entity,
        factBoxKey,
    });

    if (!config) {
        return entityOperationError("La entidad no tiene adjuntos configurados.");
    }

    const context = await getActionContext(entity.scope);
    const adminSupabase = createSupabaseAdminClient();

    const parentExists = await ensureParentRecordExists({
        adminSupabase,
        entity,
        context,
        recordId,
    });

    if (!parentExists) {
        return entityOperationError("No se ha encontrado el registro.");
    }

    try {
        let selectQuery = adminSupabase
            .from(config.table)
            .select(getDocumentSelectColumns(config))
            .eq("id", documentId)
            .eq(config.parentIdDbName, recordId)
            .limit(1);

        if (config.entityTableDbName) {
            selectQuery = selectQuery.eq(config.entityTableDbName, entity.table);
        }

        selectQuery = applyDocumentScope({
            query: selectQuery,
            entity,
            context,
        });

        const { data: documentRecord, error: documentError } =
            (await selectQuery.maybeSingle()) as {
                data: Record<string, unknown> | null;
                error: GenericSupabaseError | null;
            };

        if (documentError || !documentRecord) {
            throw new Error(
                documentError?.message ?? "No se ha encontrado el adjunto."
            );
        }

        await deleteAttachmentFile({
            supabase: adminSupabase,
            storageProvider: getStringValue(
                documentRecord,
                config.storageProviderDbName
            ),
            storageBucket: getStringValue(documentRecord, config.supabaseBucketDbName),
            filePath: getStringValue(documentRecord, config.supabasePathDbName),
            externalUrl: getStringValue(documentRecord, config.sharepointWebUrlDbName),
        });

        let deleteQuery = adminSupabase
            .from(config.table)
            .delete()
            .eq("id", documentId)
            .eq(config.parentIdDbName, recordId);

        if (config.entityTableDbName) {
            deleteQuery = deleteQuery.eq(config.entityTableDbName, entity.table);
        }

        deleteQuery = applyDocumentScope({
            query: deleteQuery,
            entity,
            context,
        });

        const { error: deleteError } = (await deleteQuery) as {
            error: GenericSupabaseError | null;
        };

        if (deleteError) {
            throw new Error(deleteError.message ?? "No se pudo eliminar el adjunto.");
        }

        return entityOperationOk({
            id: documentId,
        });
    } catch (error) {
        return entityOperationError(
            error instanceof Error
                ? error.message
                : "No se pudo eliminar el adjunto."
        );
    }
}