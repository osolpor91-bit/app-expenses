import type { ReactNode } from "react";

export type EntityFactBoxRow = {
  label: string;
  value: ReactNode;
};

type EntityFactBoxProps = {
  title: string;
  rows?: EntityFactBoxRow[];
  children?: ReactNode;
};

function getDisplayValue(value: ReactNode) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
}

export default function EntityFactBox({
  title,
  rows = [],
  children,
}: EntityFactBoxProps) {
  return (
    <div className="card-app-soft p-5">
      <h2 className="text-sm font-semibold text-primary-app">{title}</h2>

      {rows.length > 0 && (
        <div className="mt-4 space-y-2 text-sm text-app-muted">
          {rows.map((row) => (
            <p key={row.label}>
              <span className="font-medium text-primary-app">
                {row.label}:
              </span>{" "}
              {getDisplayValue(row.value)}
            </p>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}