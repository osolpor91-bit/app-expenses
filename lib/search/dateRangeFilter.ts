export type DateRangeFilterValue = {
  from: string | null;
  to: string | null;
  normalizedValue: string;
};

function getCurrentYear() {
  return String(new Date().getFullYear());
}

function getCurrentMonth() {
  return String(new Date().getMonth() + 1);
}

function isValidCalendarDate(year: string, month: string, day: string) {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);

  if (
    !Number.isInteger(numericYear) ||
    !Number.isInteger(numericMonth) ||
    !Number.isInteger(numericDay)
  ) {
    return false;
  }

  if (numericMonth < 1 || numericMonth > 12) {
    return false;
  }

  if (numericDay < 1 || numericDay > 31) {
    return false;
  }

  const date = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

  return (
    date.getUTCFullYear() === numericYear &&
    date.getUTCMonth() === numericMonth - 1 &&
    date.getUTCDate() === numericDay
  );
}

function toIsoDate({
  year,
  month,
  day,
}: {
  year: string;
  month: string;
  day: string;
}) {
  const normalizedDay = day.padStart(2, "0");
  const normalizedMonth = month.padStart(2, "0");

  if (!isValidCalendarDate(year, normalizedMonth, normalizedDay)) {
    return null;
  }

  return `${year}-${normalizedMonth}-${normalizedDay}`;
}

function formatIsoDateForDisplay(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function parseDateValue(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return toIsoDate({
      year,
      month,
      day,
    });
  }

  const slashMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;

    return toIsoDate({
      year,
      month,
      day,
    });
  }

  const dashMatch = trimmedValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

  if (dashMatch) {
    const [, day, month, year] = dashMatch;

    return toIsoDate({
      year,
      month,
      day,
    });
  }

  const dayOnlyMatch = trimmedValue.match(/^(\d{1,2})$/);

  if (dayOnlyMatch) {
    const [, day] = dayOnlyMatch;

    return toIsoDate({
      year: getCurrentYear(),
      month: getCurrentMonth(),
      day,
    });
  }

  const compactDayMonthMatch = trimmedValue.match(/^(\d{2})(\d{2})$/);

  if (compactDayMonthMatch) {
    const [, day, month] = compactDayMonthMatch;

    return toIsoDate({
      year: getCurrentYear(),
      month,
      day,
    });
  }

  const compactDayMonthYearMatch = trimmedValue.match(
    /^(\d{2})(\d{2})(\d{4})$/
  );

  if (compactDayMonthYearMatch) {
    const [, day, month, year] = compactDayMonthYearMatch;

    return toIsoDate({
      year,
      month,
      day,
    });
  }

  return null;
}

export function parseDateRangeFilterValue(
  value: string
): DateRangeFilterValue | null {
  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return null;
  }

  if (!cleanedValue.includes("..")) {
    const exactDate = parseDateValue(cleanedValue);

    if (!exactDate) {
      return null;
    }

    return {
      from: exactDate,
      to: exactDate,
      normalizedValue: formatIsoDateForDisplay(exactDate),
    };
  }

  const parts = cleanedValue.split("..");

  if (parts.length !== 2) {
    return null;
  }

  const [rawFrom = "", rawTo = ""] = parts;

  if (!rawFrom.trim() && !rawTo.trim()) {
    return null;
  }

  const from = rawFrom.trim() ? parseDateValue(rawFrom) : null;
  const to = rawTo.trim() ? parseDateValue(rawTo) : null;

  if (rawFrom.trim() && !from) {
    return null;
  }

  if (rawTo.trim() && !to) {
    return null;
  }

  if (from && to && from > to) {
    return null;
  }

  return {
    from,
    to,
    normalizedValue: `${from ? formatIsoDateForDisplay(from) : ""}..${
      to ? formatIsoDateForDisplay(to) : ""
    }`,
  };
}

export function normalizeDateRangeFilterValue(value: string) {
  if (!value.trim()) {
    return "";
  }

  return parseDateRangeFilterValue(value)?.normalizedValue ?? null;
}

export function isValidDateRangeFilterValue(value: string) {
  if (!value.trim()) {
    return true;
  }

  return Boolean(parseDateRangeFilterValue(value));
}
