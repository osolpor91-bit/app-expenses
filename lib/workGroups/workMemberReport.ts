export type WorkMemberRecord = {
  id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  is_default?: unknown;
};

export type WorkMemberGroupRelation = {
  id?: unknown;
  code?: unknown;
  description?: unknown;
  scheduled_at?: unknown;
};

export type WorkMemberAssignmentRecord = {
  id?: unknown;
  work_group_id?: unknown;
  treasury_member_id?: unknown;
  work_groups?: WorkMemberGroupRelation | WorkMemberGroupRelation[] | null;
};

export type WorkMemberReportGroup = {
  id: string;
  code: string;
  description: string;
  scheduledAt: string;
  label: string;
};

export type WorkMemberReportRow = {
  memberId: string;
  memberName: string;
  groupCount: number;
  groups: WorkMemberReportGroup[];
};

function getStringValue(value: unknown) {
  return String(value ?? "").trim();
}

function getFirstRelation<T>(relation: T | T[] | null | undefined) {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

function getMemberName(member: WorkMemberRecord) {
  if (member.is_default) {
    return "TODOS";
  }

  return (
    `${getStringValue(member.first_name)} ${getStringValue(
      member.last_name
    )}`.trim() || "-"
  );
}

function getGroupLabel(group: WorkMemberReportGroup) {
  return [group.code, group.description].filter(Boolean).join(" - ") || "-";
}

function buildGroup(assignment: WorkMemberAssignmentRecord) {
  const group = getFirstRelation(assignment.work_groups);
  const id =
    getStringValue(group?.id) || getStringValue(assignment.work_group_id);
  const code = getStringValue(group?.code);
  const description = getStringValue(group?.description);
  const scheduledAt = getStringValue(group?.scheduled_at);
  const reportGroup = {
    id,
    code,
    description,
    scheduledAt,
    label: "",
  };

  return {
    id,
    code,
    description,
    scheduledAt,
    label: getGroupLabel(reportGroup),
  } satisfies WorkMemberReportGroup;
}

export function buildWorkMemberReportRows({
  members,
  assignments,
}: {
  members: WorkMemberRecord[];
  assignments: WorkMemberAssignmentRecord[];
}) {
  const rowsByMemberId = new Map<string, WorkMemberReportRow>();

  members.forEach((member) => {
    const memberId = getStringValue(member.id);

    if (!memberId) {
      return;
    }

    rowsByMemberId.set(memberId, {
      memberId,
      memberName: getMemberName(member),
      groupCount: 0,
      groups: [],
    });
  });

  assignments.forEach((assignment) => {
    const memberId = getStringValue(assignment.treasury_member_id);
    const row = rowsByMemberId.get(memberId);

    if (!row) {
      return;
    }

    const group = buildGroup(assignment);

    const hasGroup = row.groups.some(
      (currentGroup) => currentGroup.id === group.id
    );

    if (!group.id || hasGroup) {
      return;
    }

    row.groups.push(group);
  });

  return Array.from(rowsByMemberId.values())
    .map((row) => ({
      ...row,
      groups: row.groups.sort((left, right) => {
        const dateComparison = left.scheduledAt.localeCompare(right.scheduledAt);

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return left.label.localeCompare(right.label, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }),
      groupCount: row.groups.length,
    }))
    .sort((left, right) => {
      const countComparison = right.groupCount - left.groupCount;

      if (countComparison !== 0) {
        return countComparison;
      }

      return left.memberName.localeCompare(right.memberName);
    });
}
