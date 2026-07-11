export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { Fragment } from "react";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";

const afternoonStartHour = 15;

type WorkGroupRelation = {
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
  is_lead?: unknown;
  work_group_id?: unknown;
  work_groups?: WorkGroupRelation | WorkGroupRelation[] | null;
  treasury_members?: TreasuryMemberRelation | TreasuryMemberRelation[] | null;
};

type ReportMember = {
  name: string;
  isLead: boolean;
};

type ReportGroup = {
  id: string;
  title: string;
  scheduledAt: string;
  dayKey: string;
  dayLabel: string;
  timeLabel: string;
  period: "morning" | "afternoon";
  members: ReportMember[];
};

function getStringValue(value: unknown) {
  return String(value ?? "").trim();
}

function getFirstRelation<T>(relation: T | T[] | null | undefined) {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

function getMemberName(member: TreasuryMemberRelation | null) {
  if (!member) {
    return "";
  }

  if (member.is_default) {
    return "TODOS";
  }

  return `${getStringValue(member.first_name)} ${getStringValue(
    member.last_name
  )}`.trim();
}

function getDateParts(value: string) {
  const rawValue = value.trim();
  const dateTimeMatch = rawValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T| )(\d{2}):(\d{2})/
  );

  if (dateTimeMatch) {
    const [, year, month, day, hourValue, minute] = dateTimeMatch;
    const hour = Number(hourValue);
    const weekdayDate = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), 12)
    );
    const weekday = new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      timeZone: "UTC",
    }).format(weekdayDate);

    return {
      dayKey: `${year}-${month}-${day}`,
      dayLabel: `${weekday.toUpperCase()} ${day}/${month}`.trim(),
      timeLabel: `${hourValue}:${minute}`,
      period: hour < afternoonStartHour ? "morning" : "afternoon",
    } as const;
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dayKey = date.toISOString().slice(0, 10);
  const fallbackMatch = dayKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const month = fallbackMatch?.[2] ?? "";
  const day = fallbackMatch?.[3] ?? "";
  const hour = date.getUTCHours();
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);

  return {
    dayKey,
    dayLabel: `${weekday.toUpperCase()} ${day}/${month}`.trim(),
    timeLabel: `${String(hour).padStart(2, "0")}:${minute}`,
    period: hour < afternoonStartHour ? "morning" : "afternoon",
  } as const;
}

function getGroupTitle(group: WorkGroupRelation | null) {
  return getStringValue(group?.description) || getStringValue(group?.code) || "-";
}

function buildReportGroups(assignments: WorkGroupAssignmentRecord[]) {
  const groupsById = new Map<string, ReportGroup>();

  assignments.forEach((assignment) => {
    const group = getFirstRelation(assignment.work_groups);
    const member = getFirstRelation(assignment.treasury_members);
    const groupId = getStringValue(group?.id) || getStringValue(assignment.work_group_id);
    const scheduledAt = getStringValue(group?.scheduled_at);
    const dateParts = getDateParts(scheduledAt);
    const memberName = getMemberName(member);

    if (!groupId || !dateParts) {
      return;
    }

    const reportGroup =
      groupsById.get(groupId) ??
      ({
        id: groupId,
        title: getGroupTitle(group),
        scheduledAt,
        dayKey: dateParts.dayKey,
        dayLabel: dateParts.dayLabel,
        timeLabel: dateParts.timeLabel,
        period: dateParts.period,
        members: [],
      } satisfies ReportGroup);

    if (memberName) {
      reportGroup.members.push({
        name: memberName,
        isLead: Boolean(assignment.is_lead) || Boolean(member?.is_default),
      });
    }

    groupsById.set(groupId, reportGroup);
  });

  return Array.from(groupsById.values()).sort((left, right) => {
    const dateComparison = left.scheduledAt.localeCompare(right.scheduledAt);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return left.title.localeCompare(right.title);
  });
}

function getDays(groups: ReportGroup[]) {
  const dayByKey = new Map<string, string>();

  groups.forEach((group) => {
    dayByKey.set(group.dayKey, group.dayLabel);
  });

  return Array.from(dayByKey.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

function getGroupsForCell({
  groups,
  dayKey,
  period,
}: {
  groups: ReportGroup[];
  dayKey: string;
  period: ReportGroup["period"];
}) {
  return groups.filter(
    (group) => group.dayKey === dayKey && group.period === period
  );
}

export default async function WorkGroupReportPage() {
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let groups: ReportGroup[] = [];

  if (activeCompany) {
    const { data, error } = await supabase
      .from("work_group_assignments")
      .select(
        "id, is_lead, work_group_id, work_groups:work_group_id(id, code, description, scheduled_at), treasury_members:treasury_member_id(first_name, last_name, is_default)"
      )
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(
        `${dict.workGroups.assignmentsReadError}: ${error.message}`
      );
    }

    groups = buildReportGroups((data ?? []) as WorkGroupAssignmentRecord[]);
  }

  const days = getDays(groups);
  const periods = [
    { key: "morning" as const, label: dict.workGroups.morning },
    { key: "afternoon" as const, label: dict.workGroups.afternoon },
  ];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <Link href="/configurations" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToConfigurations}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {dict.workGroups.reportTitle}
        </h1>
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.workGroups.noActiveCompanyDescription}
        </div>
      ) : groups.length === 0 || days.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.workGroups.noAssignedGroups}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div
            className="min-w-[760px] overflow-hidden rounded-lg border border-app-border bg-app"
            style={{
              display: "grid",
              gridTemplateColumns: `6.5rem repeat(${days.length}, minmax(10rem, 1fr))`,
            }}
          >
            <div className="border-b border-r border-app-border bg-app px-2 py-2" />
            {days.map((day) => (
              <div
                key={day.key}
                className="border-b border-r border-app-border bg-blue-100 px-2 py-2 text-center text-sm font-black uppercase text-app"
              >
                {day.label}
              </div>
            ))}

            {periods.map((period) => (
              <Fragment key={period.key}>
                <div
                  key={`${period.key}-label`}
                  className="flex items-center justify-center border-r border-app-border bg-blue-100 px-2 py-3 text-sm font-black uppercase text-app"
                >
                  {period.label}
                </div>
                {days.map((day) => {
                  const cellGroups = getGroupsForCell({
                    groups,
                    dayKey: day.key,
                    period: period.key,
                  });

                  return (
                    <div
                      key={`${period.key}-${day.key}`}
                      className="min-h-44 border-r border-app-border bg-app px-2 py-2"
                    >
                      <div className="space-y-2">
                        {cellGroups.map((group) => (
                          <div
                            key={group.id}
                            className="border-b border-app-border pb-2 last:border-b-0"
                          >
                            <div className="text-sm font-black uppercase leading-tight text-app underline">
                              {group.title}
                            </div>
                            <div className="text-xs font-bold text-app">
                              ({group.timeLabel})
                            </div>
                            <div className="mt-1 text-xs leading-snug text-app">
                              {group.members.length === 0
                                ? "-"
                                : group.members.map((member, index) => (
                                    <span
                                      key={`${group.id}-${member.name}-${index}`}
                                      className={
                                        member.isLead
                                          ? "font-bold text-red-700"
                                          : undefined
                                      }
                                    >
                                      {index > 0 ? ", " : ""}
                                      {member.name}
                                    </span>
                                  ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>

          <p className="mt-2 text-center text-xs italic text-app">
            {dict.workGroups.reportLeadHelp}
          </p>
        </div>
      )}
    </section>
  );
}
