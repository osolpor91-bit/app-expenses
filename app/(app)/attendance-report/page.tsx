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

function getModeHref({ detail }: { detail: boolean }) {
  return detail
    ? {
        pathname: "/attendance-report",
        query: {
          detail: "true",
        },
      }
    : "/attendance-report";
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

function buildSummaryRows(records: AttendanceRecord[]) {
  const rowByMemberId = new Map<string, AttendanceSummaryRow>();

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

function buildDetailGroups(records: AttendanceRecord[]) {
  const groupsByMemberId = new Map<string, AttendanceDetailGroup>();

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

export default async function AttendanceReportPage({
  searchParams,
}: AttendanceReportPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const detailValue = getSingleSearchParam(resolvedSearchParams.detail);
  const showDetail = detailValue === "true" || detailValue === "1";
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let rows: AttendanceSummaryRow[] = [];
  let detailGroups: AttendanceDetailGroup[] = [];

  if (activeCompany) {
    const { data, error } = await supabase
      .from("member_attendance")
      .select(
        "attendance_date, period, comment, treasury_member_id, treasury_members:treasury_member_id(id, first_name, last_name)"
      )
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .order("attendance_date", { ascending: true })
      .order("period", { ascending: true });

    if (error) {
      throw new Error(`${dict.attendance.errorReading}: ${error.message}`);
    }

    const records = (data ?? []) as AttendanceRecord[];

    rows = buildSummaryRows(records);
    detailGroups = buildDetailGroups(records);
  }

  return (
    <section
      className="max-w-[560px] space-y-4"
    >
      <div className="space-y-1">
        <Link href="/configurations" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToConfigurations}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {dict.attendance.reportTitle}
        </h1>
      </div>

      <div className="inline-flex rounded-lg border border-app-border bg-app-soft p-1 text-xs font-semibold">
        <Link
          href={getModeHref({ detail: false })}
          className={`rounded-md px-3 py-1.5 transition ${
            showDetail
              ? "text-app-muted hover:bg-app hover:text-primary-app"
              : "bg-primary-app text-white"
          }`}
        >
          {dict.reports.summaryView}
        </Link>
        <Link
          href={getModeHref({ detail: true })}
          className={`rounded-md px-3 py-1.5 transition ${
            showDetail
              ? "bg-primary-app text-white"
              : "text-app-muted hover:bg-app hover:text-primary-app"
          }`}
        >
          {dict.reports.detailView}
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
      ) : showDetail ? (
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
