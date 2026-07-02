export type ChartOfAccountGroup =
  | "basic_financing"
  | "fixed_assets"
  | "inventories"
  | "creditors_debtors"
  | "financial_accounts"
  | "expenses"
  | "income"
  | "other";

export type ChartOfAccountType =
  | "current_asset"
  | "non_current_asset"
  | "current_liability"
  | "non_current_liability"
  | "equity"
  | "profit_and_loss";

export type ChartOfAccountTypeSource = "auto" | "manual";

export type ChartOfAccountSpecialCategory = "none" | "pending_application";

export type ChartOfAccountLevel = "group" | "subgroup" | "account" | "detail";

export type ChartOfAccountDerivedValues = {
  code: string;
  codeLength: number;
  accountGroup: ChartOfAccountGroup;
  accountType: ChartOfAccountType | null;
  accountTypeSource: ChartOfAccountTypeSource;
  specialAccountCategory: ChartOfAccountSpecialCategory;
  accountLevel: ChartOfAccountLevel;
  sortCode: string;
  isHeading: boolean;
};

type ExactAccountRule = {
  code: string;
  accountType: ChartOfAccountType;
  specialAccountCategory?: ChartOfAccountSpecialCategory;
};

type PrefixAccountRule = {
  prefixes: readonly string[];
  accountType: ChartOfAccountType;
};

const SORT_CODE_LENGTH = 20;

function getHierarchicalSortCode(value: string | null | undefined) {
  const code = normalizeChartOfAccountCode(value);
  const codeLength = code.length;

  const groupPart = codeLength >= 1 ? code.slice(0, 1) : "0";
  const subgroupPart = codeLength >= 2 ? code.slice(0, 2) : "00";
  const accountPart = codeLength >= 3 ? code.slice(0, 3) : "000";

  const levelRank =
    codeLength === 1
      ? "0"
      : codeLength === 2
        ? "1"
        : codeLength === 3
          ? "2"
          : "3";

  return [
    groupPart,
    subgroupPart,
    accountPart,
    levelRank,
    code.padStart(SORT_CODE_LENGTH, "0"),
  ].join(".");
}

const EXACT_ACCOUNT_RULES: readonly ExactAccountRule[] = [
  {
    code: "460",
    accountType: "current_asset",
  },
  {
    code: "465",
    accountType: "current_liability",
  },
  {
    code: "466",
    accountType: "current_liability",
  },

  {
    code: "470",
    accountType: "current_asset",
  },
  {
    code: "471",
    accountType: "current_asset",
  },
  {
    code: "472",
    accountType: "current_asset",
  },
  {
    code: "473",
    accountType: "current_asset",
  },
  {
    code: "474",
    accountType: "current_asset",
  },
  {
    code: "475",
    accountType: "current_liability",
  },
  {
    code: "476",
    accountType: "current_liability",
  },
  {
    code: "477",
    accountType: "current_liability",
  },
  {
    code: "479",
    accountType: "current_liability",
  },

  {
    code: "480",
    accountType: "current_asset",
  },
  {
    code: "485",
    accountType: "current_liability",
  },

  {
    code: "555",
    accountType: "current_asset",
    specialAccountCategory: "pending_application",
  },

  {
    code: "560",
    accountType: "current_liability",
  },
  {
    code: "561",
    accountType: "current_liability",
  },
  {
    code: "565",
    accountType: "current_asset",
  },
  {
    code: "566",
    accountType: "current_asset",
  },
  {
    code: "567",
    accountType: "current_liability",
  },
  {
    code: "568",
    accountType: "current_liability",
  },
];

const PREFIX_ACCOUNT_RULES: readonly PrefixAccountRule[] = [
  {
    prefixes: ["10", "11", "12", "13"],
    accountType: "equity",
  },
  {
    prefixes: ["14", "15", "16", "17", "18", "19"],
    accountType: "non_current_liability",
  },

  {
    prefixes: ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29"],
    accountType: "non_current_asset",
  },

  {
    prefixes: ["30", "31", "32", "33", "34", "35", "36", "37", "38", "39"],
    accountType: "current_asset",
  },

  {
    prefixes: ["40", "41"],
    accountType: "current_liability",
  },
  {
    prefixes: ["42", "43", "44"],
    accountType: "current_asset",
  },
  {
    prefixes: ["46", "47"],
    accountType: "current_liability",
  },
  {
    prefixes: ["48", "49"],
    accountType: "current_asset",
  },

  {
    prefixes: ["50", "51", "52"],
    accountType: "current_liability",
  },
  {
    prefixes: ["53", "54", "55"],
    accountType: "current_asset",
  },
  {
    prefixes: ["56"],
    accountType: "current_liability",
  },
  {
    prefixes: ["57", "58", "59"],
    accountType: "current_asset",
  },

  {
    prefixes: ["6", "7"],
    accountType: "profit_and_loss",
  },
];

export function normalizeChartOfAccountCode(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export function isValidChartOfAccountCode(value: string | null | undefined) {
  const normalizedCode = normalizeChartOfAccountCode(value);

  return /^[0-9]+$/.test(normalizedCode);
}

export function getChartOfAccountGroupFromCode(
  value: string | null | undefined
): ChartOfAccountGroup {
  const code = normalizeChartOfAccountCode(value);
  const firstDigit = code.charAt(0);

  if (firstDigit === "1") {
    return "basic_financing";
  }

  if (firstDigit === "2") {
    return "fixed_assets";
  }

  if (firstDigit === "3") {
    return "inventories";
  }

  if (firstDigit === "4") {
    return "creditors_debtors";
  }

  if (firstDigit === "5") {
    return "financial_accounts";
  }

  if (firstDigit === "6") {
    return "expenses";
  }

  if (firstDigit === "7") {
    return "income";
  }

  return "other";
}

export function getSpecialAccountCategoryFromCode(
  value: string | null | undefined
): ChartOfAccountSpecialCategory {
  const code = normalizeChartOfAccountCode(value);

  if (code.startsWith("555")) {
    return "pending_application";
  }

  return "none";
}

export function getChartOfAccountLevelFromCode(
  value: string | null | undefined
): ChartOfAccountLevel {
  const codeLength = normalizeChartOfAccountCode(value).length;

  if (codeLength === 1) {
    return "group";
  }

  if (codeLength === 2) {
    return "subgroup";
  }

  if (codeLength === 3) {
    return "account";
  }

  return "detail";
}

export function getChartOfAccountSortCode(value: string | null | undefined) {
  return getHierarchicalSortCode(value);
}

export function getDefaultIsHeadingFromCode(value: string | null | undefined) {
  return normalizeChartOfAccountCode(value).length <= 3;
}

export function getChartOfAccountTypeFromCode(
  value: string | null | undefined
): ChartOfAccountType | null {
  const code = normalizeChartOfAccountCode(value);
  const exactRule = EXACT_ACCOUNT_RULES.find((rule) => {
    return code.startsWith(rule.code);
  });

  if (exactRule) {
    return exactRule.accountType;
  }

  const prefixRule = PREFIX_ACCOUNT_RULES.find((rule) => {
    return rule.prefixes.some((prefix) => code.startsWith(prefix));
  });

  if (prefixRule) {
    return prefixRule.accountType;
  }

  if (code.startsWith("1")) {
    return "equity";
  }

  if (code.startsWith("2")) {
    return "non_current_asset";
  }

  if (code.startsWith("3")) {
    return "current_asset";
  }

  if (code.startsWith("4")) {
    return "current_asset";
  }

  if (code.startsWith("5")) {
    return "current_asset";
  }

  if (code.startsWith("6") || code.startsWith("7")) {
    return "profit_and_loss";
  }

  return null;
}

export function getChartOfAccountDerivedValues({
  code,
  currentAccountTypeSource = "auto",
  currentIsHeading,
}: {
  code: string | null | undefined;
  currentAccountTypeSource?: ChartOfAccountTypeSource;
  currentIsHeading?: boolean | null;
}): ChartOfAccountDerivedValues {
  const normalizedCode = normalizeChartOfAccountCode(code);
  const accountType = getChartOfAccountTypeFromCode(normalizedCode);
  const accountTypeSource = currentAccountTypeSource;
  const defaultIsHeading = getDefaultIsHeadingFromCode(normalizedCode);

  return {
    code: normalizedCode,
    codeLength: normalizedCode.length,
    accountGroup: getChartOfAccountGroupFromCode(normalizedCode),
    accountType,
    accountTypeSource,
    specialAccountCategory: getSpecialAccountCategoryFromCode(normalizedCode),
    accountLevel: getChartOfAccountLevelFromCode(normalizedCode),
    sortCode: getChartOfAccountSortCode(normalizedCode),
    isHeading:
      typeof currentIsHeading === "boolean" ? currentIsHeading : defaultIsHeading,
  };
}