export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { formatDateTimeValue } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";

type WorkGroupAssignmentRelation = {
  id?: unknown;
  code?: unknown;
  description?: unknown;
  scheduled_at?: unknown;
};

type TreasuryMemberRelation = {
  first_name?: unknown;
  last_name?: unknown;
  is_default?: unknown;
};

type WorkGroupAssignmentRecord = {
  id?: unknown;
  work_group_id?: unknown;
  is_lead?: unknown;
  work_groups?: WorkGroupAssignmentRelation | WorkGroupAssignmentRelation[] | null;
  treasury_members?: TreasuryMemberRelation | TreasuryMemberRelation[] | null;
};

type WorkGroupRecord = WorkGroupAssignmentRelation;

type WorkGroupAssignmentRow = {
  id: string;
  group: WorkGroupAssignmentRelation | null;
  member: TreasuryMemberRelation | null;
  isLead: boolean;
};

type WorkGroupAssignmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringValue(value: unknown) {
  return String(value ?? "").trim();
}

function getFirstRelation<T>(relation: T | T[] | null | undefined) {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

function getMemberName(member: TreasuryMemberRelation | null) {
  if (!member) {
    return "-";
  }

  if (member.is_default) {
    return "TODOS";
  }

  return (
    `${getStringValue(member.first_name)} ${getStringValue(
      member.last_name
    )}`.trim() || "-"
  );
}

function isTruthyParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return rawValue === "true" || rawValue === "1";
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function buildAssignedRows(assignments: WorkGroupAssignmentRecord[]) {
  return assignments.map<WorkGroupAssignmentRow>((assignment, index) => ({
    id: getStringValue(assignment.id) || `assignment-${index}`,
    group: getFirstRelation(assignment.work_groups),
    member: getFirstRelation(assignment.treasury_members),
    isLead: Boolean(assignment.is_lead),
  }));
}

function buildAllRows({
  groups,
  assignments,
}: {
  groups: WorkGroupRecord[];
  assignments: WorkGroupAssignmentRecord[];
}) {
  const assignmentRowsByGroupId = new Map<string, WorkGroupAssignmentRow[]>();

  assignments.forEach((assignment, index) => {
    const groupId = getStringValue(assignment.work_group_id);
    const group = getFirstRelation(assignment.work_groups);
    const row = {
      id: getStringValue(assignment.id) || `assignment-${index}`,
      group,
      member: getFirstRelation(assignment.treasury_members),
      isLead: Boolean(assignment.is_lead),
    };
    const groupRows = assignmentRowsByGroupId.get(groupId) ?? [];

    groupRows.push(row);
    assignmentRowsByGroupId.set(groupId, groupRows);
  });

  return groups.flatMap((group, index) => {
    const groupId = getStringValue(group.id);
    const groupRows = assignmentRowsByGroupId.get(groupId);

    if (groupRows?.length) {
      return groupRows;
    }

    return [
      {
        id: `group-${groupId || index}`,
        group,
        member: null,
        isLead: false,
      },
    ];
  });
}

function sortRows(rows: WorkGroupAssignmentRow[]) {
  return [...rows].sort((left, right) => {
    const leftDate = getStringValue(left.group?.scheduled_at);
    const rightDate = getStringValue(right.group?.scheduled_at);
    const dateComparison = leftDate.localeCompare(rightDate);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const groupComparison = getStringValue(left.group?.code).localeCompare(
      getStringValue(right.group?.code),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );

    if (groupComparison !== 0) {
      return groupComparison;
    }

    return getMemberName(left.member).localeCompare(getMemberName(right.member));
  });
}

export default async function WorkGroupAssignmentsPage({
  searchParams,
}: WorkGroupAssignmentsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const showAllGroups = isTruthyParam(resolvedSearchParams.all);
  const selectedGroupId = getSingleParam(resolvedSearchParams.groupId).trim();
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let assignments: WorkGroupAssignmentRecord[] = [];
  let groups: WorkGroupRecord[] = [];

  if (activeCompany) {
    let assignmentsQuery = supabase
      .from("work_group_assignments")
      .select(
        "id, work_group_id, is_lead, work_groups:work_group_id(id, code, description, scheduled_at), treasury_members:treasury_member_id(first_name, last_name, is_default)"
      )
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .order("created_at", { ascending: true });

    if (selectedGroupId) {
      assignmentsQuery = assignmentsQuery.eq("work_group_id", selectedGroupId);
    }

    const { data, error } = await assignmentsQuery;

    if (error) {
      throw new Error(
        `${dict.workGroups.assignmentsReadError}: ${error.message}`
      );
    }

    assignments = (data ?? []) as WorkGroupAssignmentRecord[];

    if (showAllGroups) {
      const { data: groupData, error: groupsError } = await supabase
        .from("work_groups")
        .select("id, code, description, scheduled_at")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .order("scheduled_at", { ascending: true });

      if (groupsError) {
        throw new Error(
          `${dict.workGroups.errorReading}: ${groupsError.message}`
        );
      }

      groups = (groupData ?? []) as WorkGroupRecord[];
    }
  }

  const rows = sortRows(
    showAllGroups
      ? buildAllRows({ groups, assignments })
      : buildAssignedRows(assignments)
  );

  return (
    <section className="max-w-4xl space-y-4">
      <div className="space-y-1">
        <Link href="/work-groups" className="link-app inline-block text-sm">
          {"<-"} {dict.workGroups.backToWorkGroups}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {showAllGroups
            ? dict.workGroups.allGroupsTitle
            : dict.workGroups.assignedGroupsTitle}
        </h1>
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.workGroups.noActiveCompanyDescription}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.workGroups.noAssignedGroups}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-app-border bg-app">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b border-app-border bg-app-soft px-3 py-2 text-[11px] font-semibold uppercase text-app-muted sm:grid-cols-[8rem_minmax(0,1.5fr)_8rem_minmax(0,1fr)] sm:text-xs">
            <span>{dict.workGroups.code}</span>
            <span>{dict.workGroups.description}</span>
            <span className="hidden sm:block">{dict.workGroups.scheduledAt}</span>
            <span>{dict.workGroups.member}</span>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => {
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 px-3 py-2 text-xs sm:grid-cols-[8rem_minmax(0,1.5fr)_8rem_minmax(0,1fr)] sm:text-sm"
                >
                  <div className="break-words font-bold leading-tight text-primary-app">
                    {getStringValue(row.group?.code) || "-"}
                  </div>
                  <div className="break-words leading-tight text-app-muted sm:text-app">
                    {getStringValue(row.group?.description) || "-"}
                    <div className="mt-0.5 text-[11px] text-app-muted sm:hidden">
                      {formatDateTimeValue(row.group?.scheduled_at)}
                    </div>
                  </div>
                  <div className="hidden leading-tight text-app-muted sm:block">
                    {formatDateTimeValue(row.group?.scheduled_at)}
                  </div>
                  <div
                    className={`break-words font-semibold leading-tight ${
                      row.isLead || row.member?.is_default
                        ? "text-red-700"
                        : "text-app"
                    }`}
                  >
                    {getMemberName(row.member)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
