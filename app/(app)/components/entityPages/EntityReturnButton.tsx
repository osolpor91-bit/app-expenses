"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type EntityReturnButtonProps = {
  label: string;
};

function getSafeReturnTo(value: string | null) {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export default function EntityReturnButton({ label }: EntityReturnButtonProps) {
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));

  if (!returnTo) {
    return null;
  }

  return (
    <Link href={returnTo} className="link-app text-sm">
      ← {label}
    </Link>
  );
}