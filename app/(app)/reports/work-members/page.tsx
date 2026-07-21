export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { formatDateTimeValue } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";
import {
  buildWorkMemberReportRows,
  type WorkMemberAssignmentRecord,
  type WorkMemberRecord,
  type WorkMemberReportRow,
} from "@/lib/workGroups/workMemberReport";

type WorkMembersReportView = "summary" | "detail";

type WorkMembersReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type WorkMemberSummaryGroup = {
  groupCount: number;
  memberNames: string[];
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getReportView(
  searchParams: Record<string, string | string[] | undefined>
): WorkMembersReportView {
  return getSingleSearchParam(searchParams.view) === "detail"
    ? "detail"
    : "summary";
}

function getModeHref(view: WorkMembersReportView) {
  if (view === "summary") {
    return "/reports/work-members";
  }

  return {
    pathname: "/reports/work-members",
    query: {
      view,
    },
  };
}

function getModeLinkClassName({
  currentView,
  view,
}: {
  currentView: WorkMembersReportView;
  view: WorkMembersReportView;
}) {
  return `rounded-md px-3 py-1.5 transition ${
    currentView === view
      ? "bg-primary-app text-white"
      : "text-app-muted hover:bg-app hover:text-primary-app"
  }`;
}

function buildSummaryGroups(rows: WorkMemberReportRow[]) {
  const groupsByCount = new Map<number, WorkMemberSummaryGroup>();

  rows.forEach((row) => {
    const group =
      groupsByCount.get(row.groupCount) ??
      ({
        groupCount: row.groupCount,
        memberNames: [],
      } satisfies WorkMemberSummaryGroup);

    group.memberNames.push(row.memberName);
    groupsByCount.set(row.groupCount, group);
  });

  return Array.from(groupsByCount.values())
    .map((group) => ({
      ...group,
      memberNames: group.memberNames.sort((left, right) =>
        left.localeCompare(right)
      ),
    }))
    .sort((left, right) => right.groupCount - left.groupCount);
}

function renderSummaryRows({
  rows,
  labels,
}: {
  rows: WorkMemberReportRow[];
  labels: {
    member: string;
    assignedGroupsCount: string;
  };
}) {
  const groups = buildSummaryGroups(rows);

  return (
    <div className="overflow-hidden rounded-lg border border-app-border bg-app">
      <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 border-b border-app-border bg-app-soft px-3 py-2 text-[11px] font-semibold uppercase text-app-muted sm:text-xs">
        <span className="text-right">{labels.assignedGroupsCount}</span>
        <span>{labels.member}</span>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {groups.map((group) => (
          <div
            key={group.groupCount}
            className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 px-3 py-2"
          >
            <div className="text-right text-sm font-black text-primary-app">
              {group.groupCount}
            </div>
            <div className="break-words text-sm font-bold leading-snug text-primary-app">
              {group.memberNames.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderDetailRows({
  rows,
  labels,
}: {
  rows: WorkMemberReportRow[];
  labels: {
    member: string;
    assignedGroupsCount: string;
  };
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-app-border bg-app">
      <div className="grid grid-cols-[minmax(0,1fr)_4rem] gap-3 border-b border-app-border bg-app-soft px-3 py-2 text-[11px] font-semibold uppercase text-app-muted sm:text-xs">
        <span>{labels.member}</span>
        <span className="text-right">{labels.assignedGroupsCount}</span>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {rows.map((row) => (
          <div key={row.memberId} className="px-3 py-2.5">
            <div className="grid grid-cols-[minmax(0,1fr)_4rem] gap-3">
              <div className="break-words text-sm font-bold text-primary-app">
                {row.memberName}
              </div>
              <div className="text-right text-sm font-black text-primary-app">
                {row.groupCount}
              </div>
            </div>

            <div className="mt-1 flex flex-wrap gap-1.5">
              {row.groups.length === 0 ? (
                <span className="rounded-md bg-app-soft px-2 py-1 text-xs font-medium text-app-muted">
                  -
                </span>
              ) : null}

              {row.groups.map((group) => (
                <span
                  key={group.id}
                  className="rounded-md bg-app-soft px-2 py-1 text-xs font-medium text-app-muted"
                >
                  {group.label}
                  {group.scheduledAt ? (
                    <span className="ml-1 text-[11px]">
                      ({formatDateTimeValue(group.scheduledAt)})
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function WorkMembersReportPage({
  searchParams,
}: WorkMembersReportPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const currentView = getReportView(resolvedSearchParams);
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let rows: WorkMemberReportRow[] = [];

  if (activeCompany) {
    const [membersResult, assignmentsResult] = await Promise.all([
      supabase
        .from("treasury_members")
        .select("id, first_name, last_name, is_default")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .eq("is_guest", false)
        .eq("is_default", false)
        .order("first_name", { ascending: true }),
      supabase
        .from("work_group_assignments")
        .select(
          "id, work_group_id, treasury_member_id, work_groups:work_group_id(id, code, description, scheduled_at)"
        )
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .order("created_at", { ascending: true }),
    ]);

    if (membersResult.error) {
      throw new Error(
        `${dict.workGroups.membersReadError}: ${membersResult.error.message}`
      );
    }

    if (assignmentsResult.error) {
      throw new Error(
        `${dict.workGroups.assignmentsReadError}: ${assignmentsResult.error.message}`
      );
    }

    rows = buildWorkMemberReportRows({
      members: (membersResult.data ?? []) as WorkMemberRecord[],
      assignments: (assignmentsResult.data ?? []) as WorkMemberAssignmentRecord[],
    });
  }

  return (
    <section className="max-w-3xl space-y-4">
      <div className="space-y-1">
        <Link href="/reports" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToReports}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {dict.workGroups.membersWithWorkReportTitle}
        </h1>
      </div>

      <div className="inline-flex rounded-lg border border-app-border bg-app-soft p-1 text-xs font-semibold">
        <Link
          href={getModeHref("summary")}
          className={getModeLinkClassName({
            currentView,
            view: "summary",
          })}
        >
          {dict.reports.summaryView}
        </Link>
        <Link
          href={getModeHref("detail")}
          className={getModeLinkClassName({
            currentView,
            view: "detail",
          })}
        >
          {dict.reports.detailView}
        </Link>
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.workGroups.noActiveCompanyDescription}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.workGroups.noMembersWithWork}
        </div>
      ) : currentView === "detail" ? (
        renderDetailRows({
          rows,
          labels: {
            member: dict.workGroups.member,
            assignedGroupsCount: dict.workGroups.assignedGroupsCount,
          },
        })
      ) : (
        renderSummaryRows({
          rows,
          labels: {
            member: dict.workGroups.member,
            assignedGroupsCount: dict.workGroups.assignedGroupsCount,
          },
        })
      )}
    </section>
  );
}
