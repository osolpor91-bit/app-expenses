import { treasuryGeneralTypeOptions } from "@/lib/entityFields/commonOptions";
import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";

export const treasuryGeneralFields: readonly EntityFieldDefinition[] = [
    {
        key: "treasury_type",
        dbName: "treasury_type",
        labelKey: "treasuryType",
        type: "option",
        required: true,
        editable: false,
        options: treasuryGeneralTypeOptions,
        showInList: true,
        showInForm: false,
    },
    {
        key: "balance",
        dbName: "balance",
        labelKey: "balance",
        type: "decimal",
        required: false,
        editable: false,
        calculated: true,
        decimalScale: 2,
        showInList: true,
        showInForm: false,
    },
];

export const treasuryGeneralSelectColumns = getDbColumnsFromFields(
    treasuryGeneralFields,
    ["id", "tenant_id", "company_id", "sort_order", "created_at", "updated_at"]
);

export const treasuryGeneralEntity = {
    key: "treasuryGeneral",
    table: "treasury_general",
    route: "/treasury-general",
    labelsKey: "treasuryGeneral",
    scope: "company",
    pageMode: "list-detail",

    primaryFieldDbName: "treasury_type",
    newRoute: "/treasury-general/new",

    fields: treasuryGeneralFields,
    selectColumns: treasuryGeneralSelectColumns,
    updatedAtColumn: "updated_at",

    staticFilters: [
        {
            column: "treasury_type",
            operator: "neq",
            value: "Total",
        },
    ],

    orderBy: {
        column: "sort_order",
        ascending: true,
    },

    listActions: {
        create: false,
        edit: false,
        delete: false,
    },
} satisfies ListDetailEntityDefinition;
