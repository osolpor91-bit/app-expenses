import type { EntityFieldOptionDefinition } from "@/lib/entityFields/types";

export const currencyOptions = [
    {
        value: "EUR",
        labelKey: "currencyEur",
    },
    {
        value: "USD",
        labelKey: "currencyUsd",
    },
    {
        value: "GBP",
        labelKey: "currencyGbp",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const chartOfAccountTypeOptions = [
    {
        value: "current_asset",
        labelKey: "accountTypeCurrentAsset",
    },
    {
        value: "non_current_asset",
        labelKey: "accountTypeNonCurrentAsset",
    },
    {
        value: "current_liability",
        labelKey: "accountTypeCurrentLiability",
    },
    {
        value: "non_current_liability",
        labelKey: "accountTypeNonCurrentLiability",
    },
    {
        value: "equity",
        labelKey: "accountTypeEquity",
    },
    {
        value: "profit_and_loss",
        labelKey: "accountTypeProfitAndLoss",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const chartOfAccountTypeSourceOptions = [
    {
        value: "auto",
        labelKey: "accountTypeSourceAuto",
    },
    {
        value: "manual",
        labelKey: "accountTypeSourceManual",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const chartOfAccountGroupOptions = [
    {
        value: "basic_financing",
        labelKey: "accountGroupBasicFinancing",
    },
    {
        value: "fixed_assets",
        labelKey: "accountGroupFixedAssets",
    },
    {
        value: "inventories",
        labelKey: "accountGroupInventories",
    },
    {
        value: "creditors_debtors",
        labelKey: "accountGroupCreditorsDebtors",
    },
    {
        value: "financial_accounts",
        labelKey: "accountGroupFinancialAccounts",
    },
    {
        value: "expenses",
        labelKey: "accountGroupExpenses",
    },
    {
        value: "income",
        labelKey: "accountGroupIncome",
    },
    {
        value: "other",
        labelKey: "accountGroupOther",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const chartOfAccountSpecialCategoryOptions = [
    {
        value: "none",
        labelKey: "specialAccountCategoryNone",
    },
    {
        value: "pending_application",
        labelKey: "specialAccountCategoryPendingApplication",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const chartOfAccountLevelOptions = [
    {
        value: "group",
        labelKey: "accountLevelGroup",
    },
    {
        value: "subgroup",
        labelKey: "accountLevelSubgroup",
    },
    {
        value: "account",
        labelKey: "accountLevelAccount",
    },
    {
        value: "detail",
        labelKey: "accountLevelDetail",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const purchaseDocumentTypeOptions = [
    {
        value: "invoice",
        labelKey: "documentTypeInvoice",
    },
    {
        value: "credit_note",
        labelKey: "documentTypeCreditNote",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const currencySymbolsByCode = {
    EUR: "€",
    USD: "$",
    GBP: "£",
} as const;

export type CurrencyCode = keyof typeof currencySymbolsByCode;

export function getCurrencySymbol(currencyCode: string | null | undefined) {
    const normalizedCurrencyCode = String(currencyCode ?? "")
        .trim()
        .toUpperCase();

    if (normalizedCurrencyCode in currencySymbolsByCode) {
        return currencySymbolsByCode[normalizedCurrencyCode as CurrencyCode];
    }

    return normalizedCurrencyCode || "€";
}

export const purchaseLineTypeOptions = [
    {
        value: "item",
        labelKey: "purchaseLineTypeItem",
    },
    {
        value: "account",
        labelKey: "purchaseLineTypeAccount",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const treasuryGeneralTypeOptions = [
    {
        value: "Ingresos Reales",
        labelKey: "treasuryTypeRealIncome",
    },
    {
        value: "Ingresos Previstos",
        labelKey: "treasuryTypeExpectedIncome",
    },
    {
        value: "Gastos Reales",
        labelKey: "treasuryTypeRealExpense",
    },
    {
        value: "Gastos Previstos",
        labelKey: "treasuryTypeExpectedExpense",
    },
] as const satisfies readonly EntityFieldOptionDefinition[];
