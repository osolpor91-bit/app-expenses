"use client";

import {
  isValidDateRangeFilterValue,
  normalizeDateRangeFilterValue,
} from "@/lib/search/dateRangeFilter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

type FilterBarTextField = {
  type: "text";
  name: string;
  label: string;
  placeholder?: string;
};

type FilterBarDateRangeField = {
  type: "dateRange";
  name: string;
  label: string;
  placeholder?: string;
};

type FilterBarSelectField = {
  type: "select";
  name: string;
  label: string;
  allLabel: string;
  multiple?: boolean;
  options: {
    value: string;
    label: string;
  }[];
};

export type FilterBarField =
  | FilterBarTextField
  | FilterBarDateRangeField
  | FilterBarSelectField;

type FilterBarLabels = {
  apply: string;
  clear: string;
  filters: string;
  hideFilters: string;
  invalidDateRange?: string;
};

type FilterBarProps = {
  fields?: FilterBarField[];
  primaryFields?: FilterBarField[];
  secondaryFields?: FilterBarField[];
  initialValues: Record<string, string>;
  initiallyShowSecondaryFilters?: boolean;
  labels: FilterBarLabels;
};

const emptyFilterFields: FilterBarField[] = [];

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

function createEmptyValues(fields: FilterBarField[]) {
  return fields.reduce<Record<string, string>>((clearedValues, field) => {
    clearedValues[field.name] = "";
    return clearedValues;
  }, {});
}

function hasActiveValues(
  fields: FilterBarField[],
  values: Record<string, string>
) {
  return fields.some((field) => hasValue(values[field.name]));
}

function getFieldWrapperClass(field: FilterBarField) {
  if (field.type === "text" && field.name === "search") {
    return "w-full sm:w-[250px]";
  }

  if (field.type === "dateRange") {
    return "w-full sm:w-[245px]";
  }

  if (field.type === "select" && field.multiple) {
    return "w-full sm:w-[260px]";
  }

  return "w-full sm:w-[210px]";
}

function getInputClassName(hasError: boolean) {
  return [
    "input-app mt-1 h-8 w-full px-2.5 py-1 text-xs",
    hasError
      ? "border-red-500 text-red-700 outline-red-500 focus:border-red-500 focus:outline-red-500 focus:ring-red-500"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getDefaultDateRangePlaceholder() {
  const currentYear = new Date().getFullYear();

  return `12/05/${currentYear} o 12/05/${currentYear}..13/05/${currentYear}`;
}

function getMultipleSelectValues(value: string) {
  return value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getMultipleSelectLabel({
  field,
  value,
}: {
  field: FilterBarSelectField;
  value: string;
}) {
  const selectedValues = getMultipleSelectValues(value);

  if (selectedValues.length === 0) {
    return field.allLabel;
  }

  const selectedLabels = field.options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  if (selectedLabels.length === 0) {
    return field.allLabel;
  }

  return selectedLabels.join(", ");
}

function toggleMultipleSelectValue({
  currentValue,
  optionValue,
  checked,
}: {
  currentValue: string;
  optionValue: string;
  checked: boolean;
}) {
  const selectedValues = getMultipleSelectValues(currentValue);

  if (checked) {
    return Array.from(new Set([...selectedValues, optionValue])).join("|");
  }

  return selectedValues.filter((value) => value !== optionValue).join("|");
}

function renderMultipleSelectField({
  field,
  value,
  hasError,
  onChange,
}: {
  field: FilterBarSelectField;
  value: string;
  hasError: boolean;
  onChange: (name: string, value: string) => void;
}) {
  const selectedValues = getMultipleSelectValues(value);

  return (
    <details className="relative mt-1">
      <summary
        className={[
          getInputClassName(hasError),
          "flex cursor-pointer list-none items-center justify-between gap-2",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="truncate">
          {getMultipleSelectLabel({
            field,
            value,
          })}
        </span>
        <span className="text-[10px] text-app-muted">▾</span>
      </summary>

      <div className="absolute z-[110] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-app-border bg-app p-2 text-xs shadow-lg">
        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-app-soft">
          <input
            type="checkbox"
            checked={selectedValues.length === 0}
            onChange={() => onChange(field.name, "")}
          />
          <span>{field.allLabel}</span>
        </label>

        <div className="my-1 border-t border-app-border" />

        {field.options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-app-soft"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={(event) =>
                onChange(
                  field.name,
                  toggleMultipleSelectValue({
                    currentValue: value,
                    optionValue: option.value,
                    checked: event.target.checked,
                  })
                )
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

function renderField({
  field,
  value,
  error,
  onChange,
}: {
  field: FilterBarField;
  value: string;
  error: string | null;
  onChange: (name: string, value: string) => void;
}) {
  const hasError = Boolean(error);

  return (
    <div key={field.name} className={getFieldWrapperClass(field)}>
      <label className="text-[10px] font-medium leading-none text-app-muted">
        {field.label}
      </label>

      {field.type === "text" && (
        <input
          type="text"
          className={getInputClassName(hasError)}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          aria-invalid={hasError}
        />
      )}

      {field.type === "dateRange" && (
        <input
          type="text"
          className={getInputClassName(hasError)}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder ?? getDefaultDateRangePlaceholder()}
          aria-invalid={hasError}
        />
      )}

      {field.type === "select" &&
        (field.multiple ? (
          renderMultipleSelectField({
            field,
            value,
            hasError,
            onChange,
          })
        ) : (
          <select
            className={getInputClassName(hasError)}
            value={value}
            onChange={(event) => onChange(field.name, event.target.value)}
            aria-invalid={hasError}
          >
            <option value="">{field.allLabel}</option>

            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

      {error && (
        <p className="mt-1 text-[11px] font-medium text-red-700">{error}</p>
      )}
    </div>
  );
}

export default function FilterBar({
  fields,
  primaryFields,
  secondaryFields = emptyFilterFields,
  initialValues,
  initiallyShowSecondaryFilters,
  labels,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resolvedPrimaryFields = useMemo(
    () => primaryFields ?? fields ?? emptyFilterFields,
    [fields, primaryFields]
  );

  const allFields = useMemo(
    () => [...resolvedPrimaryFields, ...secondaryFields],
    [resolvedPrimaryFields, secondaryFields]
  );

  const hasActiveSecondaryFilters = hasActiveValues(
    secondaryFields,
    initialValues
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {}
  );
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(
    initiallyShowSecondaryFilters ?? hasActiveSecondaryFilters
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValues(initialValues);
    setFieldErrors({});

    if (
      initiallyShowSecondaryFilters !== false &&
      hasActiveValues(secondaryFields, initialValues)
    ) {
      setShowSecondaryFilters(true);
    }
  }, [initialValues, initiallyShowSecondaryFilters, secondaryFields]);

  const hasActiveFilters = hasActiveValues(allFields, initialValues);
  const hasSecondaryFields = secondaryFields.length > 0;

  function getInvalidDateRangeMessage() {
    return (
      labels.invalidDateRange ??
      `Formato de fecha no válido. Usa ${getDefaultDateRangePlaceholder()}.`
    );
  }

  function validateValues(nextValues: Record<string, string>) {
    const nextErrors: Record<string, string | null> = {};

    allFields.forEach((field) => {
      if (field.type !== "dateRange") {
        return;
      }

      const value = nextValues[field.name] ?? "";

      if (!isValidDateRangeFilterValue(value)) {
        nextErrors[field.name] = getInvalidDateRangeMessage();
      }
    });

    setFieldErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  }

  function normalizeValues(nextValues: Record<string, string>) {
    const normalizedValues = {
      ...nextValues,
    };

    allFields.forEach((field) => {
      if (field.type !== "dateRange") {
        return;
      }

      const value = nextValues[field.name] ?? "";
      const normalizedValue = normalizeDateRangeFilterValue(value);

      if (normalizedValue !== null) {
        normalizedValues[field.name] = normalizedValue;
      }
    });

    return normalizedValues;
  }

  function updateValue(name: string, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: null,
    }));
  }

  function navigateWithValues(nextValues: Record<string, string>) {
    if (!validateValues(nextValues)) {
      return;
    }

    const normalizedValues = normalizeValues(nextValues);

    setValues(normalizedValues);

    const params = new URLSearchParams(searchParams.toString());

    allFields.forEach((field) => {
      const value = normalizedValues[field.name]?.trim() ?? "";

      if (value) {
        params.set(field.name, value);
      } else {
        params.delete(field.name);
      }
    });

    params.delete("page");

    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(nextUrl);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateWithValues(values);
  }

  function handleClear() {
    const emptyValues = createEmptyValues(allFields);

    setValues(emptyValues);
    setFieldErrors({});
    navigateWithValues(emptyValues);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-app-soft p-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap items-end gap-2">
          {resolvedPrimaryFields.map((field) =>
            renderField({
              field,
              value: values[field.name] ?? "",
              error: fieldErrors[field.name] ?? null,
              onChange: updateValue,
            })
          )}

          {hasSecondaryFields && (
            <button
              type="button"
              onClick={() =>
                setShowSecondaryFilters(
                  (currentShowSecondaryFilters) =>
                    !currentShowSecondaryFilters
                )
              }
              className="btn-secondary-app px-3 py-1.5 text-xs"
            >
              {showSecondaryFilters ? labels.hideFilters : labels.filters}
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary-app px-3 py-1.5 text-xs disabled:opacity-60"
          >
            {labels.apply}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isPending}
              className="btn-secondary-app px-3 py-1.5 text-xs disabled:opacity-60"
            >
              {labels.clear}
            </button>
          )}
        </div>
      </div>

      {hasSecondaryFields && showSecondaryFilters && (
        <div className="mt-2 border-t border-app-border pt-2">
          <div className="flex flex-wrap gap-2">
            {secondaryFields.map((field) =>
              renderField({
                field,
                value: values[field.name] ?? "",
                error: fieldErrors[field.name] ?? null,
                onChange: updateValue,
              })
            )}
          </div>
        </div>
      )}
    </form>
  );
}
