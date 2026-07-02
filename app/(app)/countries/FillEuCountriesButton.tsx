"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/config";

import { fillEuCountriesWithAi } from "./fillEuCountriesActions";

type FillEuCountriesButtonProps = {
  locale: Locale;
  variant?: "button" | "menuItem";
  labels: {
    fill: string;
    filling: string;
  };
};

export default function FillEuCountriesButton({
  locale,
  variant = "button",
  labels,
}: FillEuCountriesButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);

    startTransition(async () => {
      const result = await fillEuCountriesWithAi(locale);

      setMessage(result.message);

      if (!result.ok) {
        return;
      }

      router.refresh();
    });
  }

  if (variant === "menuItem") {
    return (
      <div>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-app transition hover:bg-app-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? labels.filling : labels.fill}
        </button>

        {message && (
          <p className="px-3 pb-2 text-xs text-app-muted">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-secondary-app px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? labels.filling : labels.fill}
      </button>

      {message && <p className="text-xs text-app-muted">{message}</p>}
    </div>
  );
}