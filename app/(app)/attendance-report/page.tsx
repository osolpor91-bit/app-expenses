export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { formatDateValue } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";

type TreasuryMemberRelation = {
  id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
};

type AttendanceRecord = {
  attendance_date?: unknown;
  period?: unknown;
  comment?: unknown;
  treasury_member_id?: unknown;
  treasury_members?: TreasuryMemberRelation | TreasuryMemberRelation[] | null;
};

type AttendanceMemberRecord = TreasuryMemberRelation & {
  id?: unknown;
};

type AttendanceSummaryRow = {
  memberId: string;
  memberName: string;
  morning: number;
  afternoon: number;
  fullDay: number;
  total: number;
};

type AttendanceDetailRow = {
  id: string;
  memberName: string;
  attendanceDate: string;
  period: string;
  comment: string;
};

type AttendanceDetailGroup = {
  memberId: string;
  memberName: string;
  movements: AttendanceDetailRow[];
};

type AttendanceBarGroup = {
  total: number;
  names: string[];
};

type AttendanceReportView = "summary" | "detail" | "barChart";

type AttendanceReportPageProps = {
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

  return (
    `${getStringValue(member.first_name)} ${getStringValue(
      member.last_name
    )}`.trim() || "-"
  );
}

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getReportView(
  searchParams: Record<string, string | string[] | undefined>
): AttendanceReportView {
  const viewValue = getSingleSearchParam(searchParams.view);

  if (viewValue === "detail") {
    return "detail";
  }

  if (viewValue === "barChart") {
    return "barChart";
  }

  const detailValue = getSingleSearchParam(searchParams.detail);

  if (detailValue === "true" || detailValue === "1") {
    return "detail";
  }

  return "summary";
}

function getModeHref(view: AttendanceReportView) {
  if (view === "summary") {
    return "/attendance-report";
  }

  return {
    pathname: "/attendance-report",
    query: {
      view,
    },
  };
}

function getPeriodLabel({
  period,
  dict,
}: {
  period: string;
  dict: Awaited<ReturnType<typeof getDictionary>>["dict"];
}) {
  if (period === "morning") {
    return dict.attendance.morning;
  }

  if (period === "afternoon") {
    return dict.attendance.afternoon;
  }

  if (period === "full_day") {
    return dict.attendance.fullDay;
  }

  return period || "-";
}

function buildSummaryRows({
  records,
  members,
}: {
  records: AttendanceRecord[];
  members: AttendanceMemberRecord[];
}) {
  const rowByMemberId = new Map<string, AttendanceSummaryRow>();

  members.forEach((member) => {
    const memberId = getStringValue(member.id);

    if (!memberId) {
      return;
    }

    rowByMemberId.set(memberId, {
      memberId,
      memberName: getMemberName(member),
      morning: 0,
      afternoon: 0,
      fullDay: 0,
      total: 0,
    });
  });

  records.forEach((record) => {
    const member = getFirstRelation(record.treasury_members);
    const memberId =
      getStringValue(member?.id) || getStringValue(record.treasury_member_id);
    const period = getStringValue(record.period);

    if (!memberId) {
      return;
    }

    const row =
      rowByMemberId.get(memberId) ??
      ({
        memberId,
        memberName: getMemberName(member),
        morning: 0,
        afternoon: 0,
        fullDay: 0,
        total: 0,
      } satisfies AttendanceSummaryRow);

    if (period === "morning") {
      row.morning += 1;
    } else if (period === "afternoon") {
      row.afternoon += 1;
    } else if (period === "full_day") {
      row.fullDay += 1;
    }

    row.total += 1;
    rowByMemberId.set(memberId, row);
  });

  return Array.from(rowByMemberId.values()).sort((left, right) => {
    const totalComparison = right.total - left.total;

    if (totalComparison !== 0) {
      return totalComparison;
    }

    return left.memberName.localeCompare(right.memberName);
  });
}

function buildDetailGroups({
  records,
  members,
}: {
  records: AttendanceRecord[];
  members: AttendanceMemberRecord[];
}) {
  const groupsByMemberId = new Map<string, AttendanceDetailGroup>();

  members.forEach((member) => {
    const memberId = getStringValue(member.id);

    if (!memberId) {
      return;
    }

    groupsByMemberId.set(memberId, {
      memberId,
      memberName: getMemberName(member),
      movements: [],
    });
  });

  records.forEach((record, index) => {
    const member = getFirstRelation(record.treasury_members);
    const memberId =
      getStringValue(member?.id) || getStringValue(record.treasury_member_id);
    const normalizedMemberId = memberId || "member";
    const memberName = getMemberName(member);
    const group =
      groupsByMemberId.get(normalizedMemberId) ??
      ({
        memberId: normalizedMemberId,
        memberName,
        movements: [],
      } satisfies AttendanceDetailGroup);

    group.movements.push({
      id: `${normalizedMemberId}-${getStringValue(
        record.attendance_date
      )}-${getStringValue(record.period)}-${index}`,
      memberName,
      attendanceDate: getStringValue(record.attendance_date),
      period: getStringValue(record.period),
      comment: getStringValue(record.comment),
    });

    groupsByMemberId.set(normalizedMemberId, group);
  });

  return Array.from(groupsByMemberId.values())
    .map((group) => ({
      ...group,
      movements: group.movements.sort((left, right) => {
        const dateComparison = left.attendanceDate.localeCompare(
          right.attendanceDate
        );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return left.period.localeCompare(right.period);
      }),
    }))
    .sort((left, right) => {
      const totalComparison = right.movements.length - left.movements.length;

      if (totalComparison !== 0) {
        return totalComparison;
      }

      return left.memberName.localeCompare(right.memberName);
    });
}

function getMemberFirstName(memberName: string) {
  return memberName.trim().split(/\s+/)[0] || "-";
}

function buildBarGroups(rows: AttendanceSummaryRow[]) {
  const groupsByTotal = new Map<number, AttendanceBarGroup>();

  rows.forEach((row) => {
    const group =
      groupsByTotal.get(row.total) ??
      ({
        total: row.total,
        names: [],
      } satisfies AttendanceBarGroup);

    group.names.push(getMemberFirstName(row.memberName));
    groupsByTotal.set(row.total, group);
  });

  return Array.from(groupsByTotal.values())
    .map((group) => ({
      ...group,
      names: group.names.sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => right.total - left.total);
}

function getModeLinkClassName({
  currentView,
  view,
}: {
  currentView: AttendanceReportView;
  view: AttendanceReportView;
}) {
  return `rounded-md px-3 py-1.5 transition ${
    currentView === view
      ? "bg-primary-app text-white"
      : "text-app-muted hover:bg-app hover:text-primary-app"
  }`;
}

export default async function AttendanceReportPage({
  searchParams,
}: AttendanceReportPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const currentView = getReportView(resolvedSearchParams);
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let rows: AttendanceSummaryRow[] = [];
  let detailGroups: AttendanceDetailGroup[] = [];
  let barGroups: AttendanceBarGroup[] = [];

  if (activeCompany) {
    const [membersResult, attendanceResult] = await Promise.all([
      supabase
        .from("treasury_members")
        .select("id, first_name, last_name")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .eq("is_guest", false)
        .eq("is_default", false)
        .order("first_name", { ascending: true }),
      supabase
        .from("member_attendance")
        .select(
          "attendance_date, period, comment, treasury_member_id, treasury_members:treasury_member_id(id, first_name, last_name)"
        )
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .order("attendance_date", { ascending: true })
        .order("period", { ascending: true }),
    ]);

    if (membersResult.error) {
      throw new Error(
        `${dict.attendance.membersReadError}: ${membersResult.error.message}`
      );
    }

    if (attendanceResult.error) {
      throw new Error(
        `${dict.attendance.errorReading}: ${attendanceResult.error.message}`
      );
    }

    const members = (membersResult.data ?? []) as AttendanceMemberRecord[];
    const records = (attendanceResult.data ?? []) as AttendanceRecord[];

    rows = buildSummaryRows({
      records,
      members,
    });
    detailGroups = buildDetailGroups({
      records,
      members,
    });
    barGroups = buildBarGroups(rows);
  }

  return (
    <section className="max-w-3xl space-y-4">
      <div className="space-y-1">
        <Link href="/reports" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToReports}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {dict.attendance.reportTitle}
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
        <Link
          href={getModeHref("barChart")}
          className={getModeLinkClassName({
            currentView,
            view: "barChart",
          })}
        >
          {dict.reports.barChartView}
        </Link>
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.attendance.noActiveCompanyDescription}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.attendance.noAttendance}
        </div>
      ) : currentView === "detail" ? (
        <div className="overflow-hidden rounded-lg border border-app-border bg-app">
          <div className="divide-y divide-[var(--color-border)]">
            {detailGroups.map((group) => (
              <div
                key={group.memberId}
                className="space-y-1.5 px-3 py-2.5 text-xs sm:text-sm"
              >
                <div className="break-words font-bold leading-tight text-primary-app">
                  {group.memberName}
                </div>
                <ul className="space-y-1">
                  {group.movements.length === 0 ? (
                    <li className="rounded-md bg-app-soft px-2 py-1.5 leading-tight text-app-muted">
                      -
                    </li>
                  ) : null}

                  {group.movements.map((movement) => (
                    <li
                      key={movement.id}
                      className="rounded-md bg-app-soft px-2 py-1.5 leading-tight text-app"
                    >
                      <span className="font-semibold text-primary-app">
                        {formatDateValue(movement.attendanceDate)}
                      </span>
                      <span className="mx-1 text-app-muted">-</span>
                      <span>
                        {getPeriodLabel({ period: movement.period, dict })}
                      </span>
                      {movement.comment ? (
                        <>
                          <span className="mx-1 text-app-muted">-</span>
                          <span className="text-app-muted">
                            {movement.comment}
                          </span>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : currentView === "barChart" ? (
        <div className="overflow-hidden rounded-lg border border-app-border bg-app p-3 sm:p-4">
          <div className="space-y-3">
            {barGroups.map((group) => {
              const maxTotal = barGroups[0]?.total ?? group.total;
              const widthPercentage =
                maxTotal > 0 ? Math.max((group.total / maxTotal) * 100, 12) : 0;

              return (
                <div
                  key={group.total}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3"
                >
                  <div className="text-right text-sm font-black text-primary-app">
                    {group.total}
                  </div>
                  <div className="relative min-h-10 min-w-0 overflow-hidden rounded-md bg-app-soft">
                    <div
                      className="absolute inset-y-0 left-0 rounded-md"
                      style={{
                        width: `${widthPercentage}%`,
                        backgroundColor:
                          "color-mix(in srgb, var(--color-primary) 22%, transparent)",
                      }}
                    />
                    <div className="relative px-3 py-2 text-sm font-bold leading-snug text-primary-app">
                      {group.names.join(", ")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-app-border bg-app">
          <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] gap-2 border-b border-app-border bg-app-soft px-2 py-2 text-[10px] font-semibold uppercase text-app-muted sm:px-3 sm:text-xs">
            <span>{dict.attendance.member}</span>
            <span className="text-center">{dict.attendance.morningShort}</span>
            <span className="text-center">{dict.attendance.afternoonShort}</span>
            <span className="text-center">{dict.attendance.totalShort}</span>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => (
              <div
                key={row.memberId}
                className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] gap-2 px-2 py-2 text-xs sm:px-3 sm:text-sm"
              >
                <div className="break-words font-bold leading-tight text-primary-app">
                  {row.memberName}
                </div>
                <div className="text-center font-semibold text-app">
                  {row.morning}
                </div>
                <div className="text-center font-semibold text-app">
                  {row.afternoon}
                </div>
                <div className="text-center font-black text-primary-app">
                  {row.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
