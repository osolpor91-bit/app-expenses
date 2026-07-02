"use client";

import { useState, type FormEvent } from "react";

import {
  sendEmailConfigurationTestEmailAction,
  updateEmailConfigurationMicrosoftClientSecretAction,
  updateEmailConfigurationSmtpPasswordAction,
} from "@/app/(app)/actions/emailConfigurationActions";

type EmailConfigurationToolsLabels = {
  smtpPasswordTitle: string;
  smtpPasswordDescription: string;
  smtpPasswordPlaceholder: string;
  saveSmtpPassword: string;
  savingSmtpPassword: string;
  smtpPasswordSaved: string;

  microsoftSecretTitle: string;
  microsoftSecretDescription: string;
  microsoftSecretPlaceholder: string;
  saveMicrosoftSecret: string;
  savingMicrosoftSecret: string;
  microsoftSecretSaved: string;

  testTitle: string;
  testDescription: string;
  destinationEmail: string;
  destinationEmailPlaceholder: string;
  sendTestEmail: string;
  sendingTestEmail: string;
  testEmailSent: string;
  requiredSecretError: string;
};

type EmailConfigurationToolsProps = {
  recordId: string;
  labels: EmailConfigurationToolsLabels;
};

export default function EmailConfigurationTools({
  recordId,
  labels,
}: EmailConfigurationToolsProps) {
  const [smtpPassword, setSmtpPassword] = useState("");
  const [microsoftClientSecret, setMicrosoftClientSecret] = useState("");
  const [destinationEmail, setDestinationEmail] = useState("");

  const [smtpPasswordMessage, setSmtpPasswordMessage] = useState<string | null>(
    null
  );
  const [microsoftSecretMessage, setMicrosoftSecretMessage] = useState<
    string | null
  >(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const [smtpPasswordError, setSmtpPasswordError] = useState<string | null>(
    null
  );
  const [microsoftSecretError, setMicrosoftSecretError] = useState<
    string | null
  >(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [isSavingSmtpPassword, setIsSavingSmtpPassword] = useState(false);
  const [isSavingMicrosoftSecret, setIsSavingMicrosoftSecret] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  async function handleSaveSmtpPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSmtpPasswordMessage(null);
    setSmtpPasswordError(null);

    if (!smtpPassword) {
      setSmtpPasswordError(labels.requiredSecretError);
      return;
    }

    setIsSavingSmtpPassword(true);

    const result = await updateEmailConfigurationSmtpPasswordAction({
      id: recordId,
      password: smtpPassword,
    });

    setIsSavingSmtpPassword(false);

    if (!result.ok) {
      setSmtpPasswordError(result.error);
      return;
    }

    setSmtpPassword("");
    setSmtpPasswordMessage(labels.smtpPasswordSaved);
  }

  async function handleSaveMicrosoftSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMicrosoftSecretMessage(null);
    setMicrosoftSecretError(null);

    if (!microsoftClientSecret) {
      setMicrosoftSecretError(labels.requiredSecretError);
      return;
    }

    setIsSavingMicrosoftSecret(true);

    const result = await updateEmailConfigurationMicrosoftClientSecretAction({
      id: recordId,
      clientSecret: microsoftClientSecret,
    });

    setIsSavingMicrosoftSecret(false);

    if (!result.ok) {
      setMicrosoftSecretError(result.error);
      return;
    }

    setMicrosoftClientSecret("");
    setMicrosoftSecretMessage(labels.microsoftSecretSaved);
  }

  async function handleSendTestEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setTestMessage(null);
    setTestError(null);

    setIsSendingTestEmail(true);

    const result = await sendEmailConfigurationTestEmailAction({
      id: recordId,
      destinationEmail,
    });

    setIsSendingTestEmail(false);

    if (!result.ok) {
      setTestError(result.error);
      return;
    }

    setTestMessage(labels.testEmailSent);
  }

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-3">
      <form onSubmit={handleSaveSmtpPassword} className="card-app p-5">
        <h2 className="text-base font-semibold text-primary-app">
          {labels.smtpPasswordTitle}
        </h2>

        <p className="mt-2 text-sm text-app-muted">
          {labels.smtpPasswordDescription}
        </p>

        <div className="mt-4">
          <label className="text-sm font-medium text-primary-app">
            {labels.smtpPasswordTitle}
          </label>

          <input
            type="password"
            className="input-app mt-1 px-3 py-2 text-sm"
            value={smtpPassword}
            placeholder={labels.smtpPasswordPlaceholder}
            disabled={isSavingSmtpPassword}
            onChange={(event) => setSmtpPassword(event.target.value)}
          />
        </div>

        {smtpPasswordError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {smtpPasswordError}
          </p>
        )}

        {smtpPasswordMessage && (
          <p className="mt-3 rounded-md border border-app bg-app-soft px-3 py-2 text-sm font-medium text-app-muted">
            {smtpPasswordMessage}
          </p>
        )}

        <div className="mt-4">
          <button
            type="submit"
            className="btn-primary-app px-4 py-2 text-sm"
            disabled={isSavingSmtpPassword}
          >
            {isSavingSmtpPassword
              ? labels.savingSmtpPassword
              : labels.saveSmtpPassword}
          </button>
        </div>
      </form>

      <form onSubmit={handleSaveMicrosoftSecret} className="card-app p-5">
        <h2 className="text-base font-semibold text-primary-app">
          {labels.microsoftSecretTitle}
        </h2>

        <p className="mt-2 text-sm text-app-muted">
          {labels.microsoftSecretDescription}
        </p>

        <div className="mt-4">
          <label className="text-sm font-medium text-primary-app">
            {labels.microsoftSecretTitle}
          </label>

          <input
            type="password"
            className="input-app mt-1 px-3 py-2 text-sm"
            value={microsoftClientSecret}
            placeholder={labels.microsoftSecretPlaceholder}
            disabled={isSavingMicrosoftSecret}
            onChange={(event) => setMicrosoftClientSecret(event.target.value)}
          />
        </div>

        {microsoftSecretError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {microsoftSecretError}
          </p>
        )}

        {microsoftSecretMessage && (
          <p className="mt-3 rounded-md border border-app bg-app-soft px-3 py-2 text-sm font-medium text-app-muted">
            {microsoftSecretMessage}
          </p>
        )}

        <div className="mt-4">
          <button
            type="submit"
            className="btn-primary-app px-4 py-2 text-sm"
            disabled={isSavingMicrosoftSecret}
          >
            {isSavingMicrosoftSecret
              ? labels.savingMicrosoftSecret
              : labels.saveMicrosoftSecret}
          </button>
        </div>
      </form>

      <form onSubmit={handleSendTestEmail} className="card-app p-5">
        <h2 className="text-base font-semibold text-primary-app">
          {labels.testTitle}
        </h2>

        <p className="mt-2 text-sm text-app-muted">
          {labels.testDescription}
        </p>

        <div className="mt-4">
          <label className="text-sm font-medium text-primary-app">
            {labels.destinationEmail}
          </label>

          <input
            type="email"
            className="input-app mt-1 px-3 py-2 text-sm"
            value={destinationEmail}
            placeholder={labels.destinationEmailPlaceholder}
            disabled={isSendingTestEmail}
            required
            onChange={(event) => setDestinationEmail(event.target.value)}
          />
        </div>

        {testError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {testError}
          </p>
        )}

        {testMessage && (
          <p className="mt-3 rounded-md border border-app bg-app-soft px-3 py-2 text-sm font-medium text-app-muted">
            {testMessage}
          </p>
        )}

        <div className="mt-4">
          <button
            type="submit"
            className="btn-primary-app px-4 py-2 text-sm"
            disabled={isSendingTestEmail}
          >
            {isSendingTestEmail
              ? labels.sendingTestEmail
              : labels.sendTestEmail}
          </button>
        </div>
      </form>
    </div>
  );
}