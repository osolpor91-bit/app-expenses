const afternoonStartHour = 15;

export type WorkGroupRelation = {
  id?: unknown;
  code?: unknown;
  description?: unknown;
  scheduled_at?: unknown;
};

export type TreasuryMemberRelation = {
  first_name?: unknown;
  last_name?: unknown;
  is_default?: unknown;
};

export type WorkGroupAssignmentRecord = {
  id?: unknown;
  is_lead?: unknown;
  work_group_id?: unknown;
  work_groups?: WorkGroupRelation | WorkGroupRelation[] | null;
  treasury_members?: TreasuryMemberRelation | TreasuryMemberRelation[] | null;
};

export type ReportMember = {
  name: string;
  isLead: boolean;
};

export type ReportPeriod = "morning" | "afternoon";

export type ReportGroup = {
  id: string;
  title: string;
  scheduledAt: string;
  dayKey: string;
  dayLabel: string;
  timeLabel: string;
  period: ReportPeriod;
  members: ReportMember[];
};

export type ReportDay = {
  key: string;
  label: string;
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

export function buildReportGroups(assignments: WorkGroupAssignmentRecord[]) {
  const groupsById = new Map<string, ReportGroup>();

  assignments.forEach((assignment) => {
    const group = getFirstRelation(assignment.work_groups);
    const member = getFirstRelation(assignment.treasury_members);
    const groupId =
      getStringValue(group?.id) || getStringValue(assignment.work_group_id);
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

export function getDays(groups: ReportGroup[]): ReportDay[] {
  const dayByKey = new Map<string, string>();

  groups.forEach((group) => {
    dayByKey.set(group.dayKey, group.dayLabel);
  });

  return Array.from(dayByKey.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function getGroupsForCell({
  groups,
  dayKey,
  period,
}: {
  groups: ReportGroup[];
  dayKey: string;
  period: ReportPeriod;
}) {
  return groups.filter(
    (group) => group.dayKey === dayKey && group.period === period
  );
}
