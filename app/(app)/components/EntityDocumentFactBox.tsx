"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import {
  deleteEntityDocumentFactBoxAction,
  getEntityDocumentFactBoxAction,
  uploadEntityDocumentFactBoxAction,
} from "../actions/entityDocumentFactBoxActions";
import EntityFactBox from "./EntityFactBox";

type EntityDocumentFactBoxLabels = {
  title: string;
  selectRecord: string;
  loading: string;
  empty: string;
  open: string;
  download: string;
  upload: string;
  uploading: string;
  delete: string;
  deleting: string;
  confirmDelete: string;
  error: string;
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

type EntityDocumentFactBoxProps = {
  entityKey: string;
  recordId: string | null;
  factBoxKey?: string;
  labels: EntityDocumentFactBoxLabels;
};

function formatFileSize(sizeBytes: number | null) {
  if (sizeBytes === null || sizeBytes === undefined) {
    return "";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileMetaText(document: EntityDocumentFactBoxDocument) {
  const parts = [
    document.contentType,
    document.sizeBytes !== null ? formatFileSize(document.sizeBytes) : null,
  ].filter(Boolean);

  return parts.join(" · ");
}

export default function EntityDocumentFactBox({
  entityKey,
  recordId,
  factBoxKey,
  labels,
}: EntityDocumentFactBoxProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<EntityDocumentFactBoxDocument[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!recordId) {
      setDocuments([]);
      setErrorMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const result = await getEntityDocumentFactBoxAction({
      entityKey,
      recordId,
      factBoxKey,
    });

    setIsLoading(false);

    if (!result.ok) {
      setDocuments([]);
      setErrorMessage(result.error);
      return;
    }

    setDocuments(result.data.documents);
  }, [entityKey, recordId, factBoxKey]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  function handleUploadButtonClick() {
    if (!recordId || isUploading || deletingDocumentId) {
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile || !recordId) {
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    setErrorMessage("");

    const result = await uploadEntityDocumentFactBoxAction(
      {
        entityKey,
        recordId,
        factBoxKey,
      },
      formData
    );

    setIsUploading(false);
    event.target.value = "";

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    await loadDocuments();
  }

  async function handleDeleteDocument(documentId: string) {
    if (!recordId || isUploading || deletingDocumentId) {
      return;
    }

    const confirmed = window.confirm(labels.confirmDelete);

    if (!confirmed) {
      return;
    }

    setDeletingDocumentId(documentId);
    setErrorMessage("");

    const result = await deleteEntityDocumentFactBoxAction({
      entityKey,
      recordId,
      factBoxKey,
      documentId,
    });

    setDeletingDocumentId(null);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    await loadDocuments();
  }

  return (
    <EntityFactBox title={labels.title}>
      {recordId ? (
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="btn-primary-app w-full px-3 py-2 text-xs"
            onClick={handleUploadButtonClick}
            disabled={isUploading || Boolean(deletingDocumentId)}
          >
            {isUploading ? labels.uploading : labels.upload}
          </button>
        </div>
      ) : null}

      {!recordId ? (
        <p className="mt-3 text-sm text-app-muted">{labels.selectRecord}</p>
      ) : null}

      {recordId && isLoading ? (
        <p className="mt-3 text-sm text-app-muted">{labels.loading}</p>
      ) : null}

      {recordId && errorMessage ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {labels.error}: {errorMessage}
        </p>
      ) : null}

      {recordId && !isLoading && !errorMessage && documents.length === 0 ? (
        <p className="mt-3 text-sm text-app-muted">{labels.empty}</p>
      ) : null}

      {documents.length > 0 ? (
        <div className="mt-4 space-y-3">
          {documents.map((document) => {
            const metaText = getFileMetaText(document);
            const isDeleting = deletingDocumentId === document.id;

            return (
              <div
                key={document.id}
                className="rounded-xl border border-app bg-white p-3 shadow-sm"
              >
                <p className="break-words text-sm font-semibold text-primary-app">
                  {document.fileName}
                </p>

                {metaText ? (
                  <p className="mt-1 break-words text-xs text-app-muted">
                    {metaText}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {document.openUrl ? (
                    <a
                      href={document.openUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary-app px-3 py-2 text-xs"
                    >
                      {labels.open}
                    </a>
                  ) : null}

                  {document.downloadUrl ? (
                    <a
                      href={document.downloadUrl}
                      className="btn-primary-app px-3 py-2 text-xs"
                    >
                      {labels.download}
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void handleDeleteDocument(document.id)}
                    disabled={isUploading || Boolean(deletingDocumentId)}
                  >
                    {isDeleting ? labels.deleting : labels.delete}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </EntityFactBox>
  );
}