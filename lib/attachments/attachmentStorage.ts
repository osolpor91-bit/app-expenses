import { attachmentStorageBucket } from "@/lib/attachments/attachmentConfig";

export type AttachmentStorageProvider = "supabase_storage" | "sharepoint";

export type StoredAttachmentFile = {
  storageProvider: AttachmentStorageProvider;
  storageBucket: string | null;
  filePath: string | null;
  externalUrl: string | null;
};

type StoreAttachmentFileInput = {
  supabase: any;
  provider: string | null;
  file: File;
  pathParts: string[];
  fileName: string;
};

type DeleteAttachmentFileInput = {
  supabase: any;
  storageProvider: string | null;
  storageBucket: string | null;
  filePath: string | null;
  externalUrl: string | null;
};

function normalizeStorageProvider(
  provider: string | null
): AttachmentStorageProvider {
  if (provider === "sharepoint") {
    return "sharepoint";
  }

  return "supabase_storage";
}

function sanitizeFileName(fileName: string) {
  const cleanedFileName = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleanedFileName || "adjunto";
}

function getFileExtension(fileName: string) {
  const match = fileName.match(/\.[a-zA-Z0-9]+$/);

  return match?.[0]?.toLowerCase() ?? "";
}

function buildStoragePath({
  pathParts,
  fileName,
}: {
  pathParts: string[];
  fileName: string;
}) {
  const safeFileName = sanitizeFileName(fileName);
  const fileExtension = getFileExtension(safeFileName);
  const generatedFileName =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `${crypto.randomUUID()}${fileExtension || ""}`
      : `${Date.now()}-${safeFileName}`;

  return [...pathParts, generatedFileName]
    .map((pathPart) => pathPart.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

async function storeInSupabaseStorage({
  supabase,
  file,
  pathParts,
  fileName,
}: {
  supabase: any;
  file: File;
  pathParts: string[];
  fileName: string;
}): Promise<StoredAttachmentFile> {
  const storagePath = buildStoragePath({
    pathParts,
    fileName,
  });

  const { error } = await supabase.storage
    .from(attachmentStorageBucket)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message ?? "No se pudo subir el archivo.");
  }

  return {
    storageProvider: "supabase_storage",
    storageBucket: attachmentStorageBucket,
    filePath: storagePath,
    externalUrl: null,
  };
}

async function storeInSharePoint({
  file,
}: {
  file: File;
}): Promise<StoredAttachmentFile> {
  void file;

  throw new Error(
    "La subida a SharePoint todavía no está implementada. La lógica ya está separada para añadir este proveedor más adelante."
  );
}

export async function storeAttachmentFile({
  supabase,
  provider,
  file,
  pathParts,
  fileName,
}: StoreAttachmentFileInput): Promise<StoredAttachmentFile> {
  const normalizedProvider = normalizeStorageProvider(provider);

  if (normalizedProvider === "sharepoint") {
    return storeInSharePoint({
      file,
    });
  }

  return storeInSupabaseStorage({
    supabase,
    file,
    pathParts,
    fileName,
  });
}

export async function deleteAttachmentFile({
  supabase,
  storageProvider,
  storageBucket,
  filePath,
  externalUrl,
}: DeleteAttachmentFileInput) {
  const normalizedProvider = normalizeStorageProvider(storageProvider);

  if (normalizedProvider === "sharepoint") {
    void externalUrl;

    throw new Error(
      "La eliminación de adjuntos en SharePoint todavía no está implementada. La lógica ya está separada para añadir este proveedor más adelante."
    );
  }

  if (!storageBucket || !filePath) {
    throw new Error("El adjunto no tiene ruta de almacenamiento.");
  }

  const normalizedFilePath = filePath.replace(/^\/+/, "");

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .remove([normalizedFilePath]);

  if (error) {
    throw new Error(error.message ?? "No se pudo eliminar el archivo.");
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(
      `Supabase Storage no confirmó la eliminación del archivo: ${normalizedFilePath}`
    );
  }
}