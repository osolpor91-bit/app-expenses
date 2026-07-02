type TextFilterOperator = "ilike" | "eq";

type PostgrestFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike";

type ParsedCondition = {
  operator: PostgrestFilterOperator;
  value: string;
};

type ParsedBranch = ParsedCondition[];

type ParsedExpression = {
  branches: ParsedBranch[];
};

function splitByOperator(value: string, operator: string) {
  return value
    .split(operator)
    .map((part) => part.trim())
    .filter(Boolean);
}

function cleanFilterValue(value: string) {
  return value.trim().replace(/[(),]/g, " ").replace(/\s+/g, " ");
}

function normalizeWildcardValue(value: string) {
  return cleanFilterValue(value).replace(/\*/g, "%");
}

function getDefaultTextCondition({
  value,
  defaultOperator,
  ignoreCase,
}: {
  value: string;
  defaultOperator: TextFilterOperator;
  ignoreCase: boolean;
}): ParsedCondition | null {
  const cleanValue = cleanFilterValue(value);

  if (!cleanValue) {
    return null;
  }

  if (cleanValue.includes("*")) {
    return {
      operator: ignoreCase || defaultOperator === "ilike" ? "ilike" : "like",
      value: normalizeWildcardValue(cleanValue),
    };
  }

  if (defaultOperator === "eq") {
    return {
      operator: "eq",
      value: cleanValue,
    };
  }

  return {
    operator: "ilike",
    value: `%${cleanValue}%`,
  };
}

function parseRangeCondition(value: string): ParsedCondition[] | null {
  const parts = value.split("..");

  if (parts.length !== 2) {
    return null;
  }

  const [rawFrom = "", rawTo = ""] = parts;
  const from = cleanFilterValue(rawFrom);
  const to = cleanFilterValue(rawTo);

  if (!from && !to) {
    return null;
  }

  const conditions: ParsedCondition[] = [];

  if (from) {
    conditions.push({
      operator: "gte",
      value: from,
    });
  }

  if (to) {
    conditions.push({
      operator: "lte",
      value: to,
    });
  }

  return conditions;
}

function parseComparisonCondition(value: string): ParsedCondition | null {
  const comparisonOperators: {
    prefix: string;
    operator: PostgrestFilterOperator;
  }[] = [
    {
      prefix: ">=",
      operator: "gte",
    },
    {
      prefix: "<=",
      operator: "lte",
    },
    {
      prefix: "<>",
      operator: "neq",
    },
    {
      prefix: ">",
      operator: "gt",
    },
    {
      prefix: "<",
      operator: "lt",
    },
  ];

  const comparisonOperator = comparisonOperators.find(({ prefix }) =>
    value.startsWith(prefix)
  );

  if (!comparisonOperator) {
    return null;
  }

  const cleanValue = cleanFilterValue(
    value.slice(comparisonOperator.prefix.length)
  );

  if (!cleanValue) {
    return null;
  }

  return {
    operator: comparisonOperator.operator,
    value: cleanValue,
  };
}

function parseSingleCondition({
  rawCondition,
  defaultOperator,
}: {
  rawCondition: string;
  defaultOperator: TextFilterOperator;
}): ParsedCondition[] | null {
  let condition = rawCondition.trim();

  if (!condition) {
    return null;
  }

  const ignoreCase = condition.startsWith("@");

  if (ignoreCase) {
    condition = condition.slice(1).trim();
  }

  if (!condition) {
    return null;
  }

  if (condition.includes("..")) {
    return parseRangeCondition(condition);
  }

  const comparisonCondition = parseComparisonCondition(condition);

  if (comparisonCondition) {
    return [comparisonCondition];
  }

  const defaultCondition = getDefaultTextCondition({
    value: condition,
    defaultOperator,
    ignoreCase,
  });

  return defaultCondition ? [defaultCondition] : null;
}

function parseBranch({
  rawBranch,
  defaultOperator,
}: {
  rawBranch: string;
  defaultOperator: TextFilterOperator;
}): ParsedBranch | null {
  const rawConditions = splitByOperator(rawBranch, "&");

  if (rawConditions.length === 0) {
    return null;
  }

  const conditions: ParsedCondition[] = [];

  for (const rawCondition of rawConditions) {
    const parsedConditions = parseSingleCondition({
      rawCondition,
      defaultOperator,
    });

    if (!parsedConditions) {
      return null;
    }

    conditions.push(...parsedConditions);
  }

  return conditions;
}

function parseFilterExpression({
  rawValue,
  defaultOperator,
}: {
  rawValue: string;
  defaultOperator: TextFilterOperator;
}): ParsedExpression | null {
  const cleanedValue = rawValue.trim();

  if (!cleanedValue) {
    return null;
  }

  const rawBranches = splitByOperator(cleanedValue, "|");

  if (rawBranches.length === 0) {
    return null;
  }

  const branches: ParsedBranch[] = [];

  for (const rawBranch of rawBranches) {
    const branch = parseBranch({
      rawBranch,
      defaultOperator,
    });

    if (!branch || branch.length === 0) {
      return null;
    }

    branches.push(branch);
  }

  return {
    branches,
  };
}

function toPostgrestCondition({
  column,
  condition,
}: {
  column: string;
  condition: ParsedCondition;
}) {
  return `${column}.${condition.operator}.${condition.value}`;
}

function toPostgrestBranch({
  column,
  branch,
}: {
  column: string;
  branch: ParsedBranch;
}) {
  if (branch.length === 1) {
    return toPostgrestCondition({
      column,
      condition: branch[0],
    });
  }

  return `and(${branch
    .map((condition) =>
      toPostgrestCondition({
        column,
        condition,
      })
    )
    .join(",")})`;
}

function applyCondition<TQuery>({
  query,
  column,
  condition,
}: {
  query: TQuery;
  column: string;
  condition: ParsedCondition;
}) {
  return (query as any).filter(column, condition.operator, condition.value);
}

export function applyAdvancedTextFilter<TQuery>({
  query,
  column,
  rawValue,
  defaultOperator,
}: {
  query: TQuery;
  column: string;
  rawValue: string;
  defaultOperator: TextFilterOperator;
}): TQuery {
  const expression = parseFilterExpression({
    rawValue,
    defaultOperator,
  });

  if (!expression) {
    return query;
  }

  if (expression.branches.length > 1) {
    const orExpression = expression.branches
      .map((branch) =>
        toPostgrestBranch({
          column,
          branch,
        })
      )
      .join(",");

    return (query as any).or(orExpression) as TQuery;
  }

  const [branch] = expression.branches;

  if (!branch) {
    return query;
  }

  let filteredQuery = query;

  branch.forEach((condition) => {
    filteredQuery = applyCondition({
      query: filteredQuery,
      column,
      condition,
    });
  });

  return filteredQuery;
}