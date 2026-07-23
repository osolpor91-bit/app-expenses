import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type PublicCompanyRecord = {
  id: string;
  tenant_id: string;
  name: string | null;
};

type PublicMemberRecord = {
  id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  is_default?: unknown;
  is_guest?: unknown;
};

type PublicGroupRelation = {
  id?: unknown;
  code?: unknown;
  description?: unknown;
  scheduled_at?: unknown;
};

type PublicMemberRelation = PublicMemberRecord | null;

type PublicAssignmentRecord = {
  id?: unknown;
  is_lead?: unknown;
  work_group_id?: unknown;
  treasury_member_id?: unknown;
  work_groups?: PublicGroupRelation | PublicGroupRelation[] | null;
  treasury_members?: PublicMemberRelation | PublicMemberRelation[] | null;
};

export type PublicWorkGroupMemberOption = {
  memberId: string;
  name: string;
};

export type PublicWorkGroupCompanion = {
  name: string;
  isLead: boolean;
};

export type PublicWorkGroupSummary = {
  groupId: string;
  title: string;
  scheduledAt: string;
  dayLabel: string;
  timeLabel: string;
  periodLabel: string;
  isLead: boolean;
  companions: PublicWorkGroupCompanion[];
};

export type PublicWorkGroupMemberGroups = {
  memberId: string;
  memberName: string;
  companyName: string;
  groupCount: number;
  groups: PublicWorkGroupSummary[];
};

const afternoonStartHour = 15;
const publicCompanyIdEnvName = "WORK_GROUP_PUBLIC_COMPANY_ID";

function getStringValue(value: unknown) {
  return String(value ?? "").trim();
}

function getFirstRelation<T>(relation: T | T[] | null | undefined) {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

function getMemberName(member: PublicMemberRecord | null) {
  if (!member || member.is_default || member.is_guest) {
    return "";
  }

  return `${getStringValue(member.first_name)} ${getStringValue(
    member.last_name
  )}`.trim();
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getGroupTitle(group: PublicGroupRelation | null) {
  return getStringValue(group?.description) || getStringValue(group?.code) || "-";
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
      dayLabel: `${weekday.toUpperCase()} ${day}/${month}`,
      timeLabel: `${hourValue}:${minute}`,
      periodLabel: hour < afternoonStartHour ? "Mañana" : "Tarde",
    };
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return {
      dayLabel: "Hora no indicada",
      timeLabel: "--:--",
      periodLabel: "Sin turno",
    };
  }

  const dayKey = date.toISOString().slice(0, 10);
  const [, , month = "", day = ""] =
    dayKey.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? [];
  const hour = date.getUTCHours();
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);

  return {
    dayLabel: `${weekday.toUpperCase()} ${day}/${month}`,
    timeLabel: `${String(hour).padStart(2, "0")}:${minute}`,
    periodLabel: hour < afternoonStartHour ? "Mañana" : "Tarde",
  };
}

async function getPublicWorkGroupCompany() {
  const supabase = createSupabaseAdminClient();
  const configuredCompanyId = process.env[publicCompanyIdEnvName]?.trim();

  let query = supabase
    .from("companies")
    .select("id, tenant_id, name")
    .order("name", { ascending: true })
    .limit(1);

  if (configuredCompanyId) {
    query = query.eq("id", configuredCompanyId);
  }

  const { data, error } = (await query.maybeSingle()) as {
    data: PublicCompanyRecord | null;
    error: { message?: string } | null;
  };

  if (error) {
    throw new Error(error.message ?? "No se pudo cargar la compañía pública.");
  }

  return data;
}

export async function searchPublicWorkGroupMembers(query: string) {
  const company = await getPublicWorkGroupCompany();
  const normalizedQuery = normalizeSearchText(query);

  if (!company || normalizedQuery.length < 2) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = (await supabase
    .from("treasury_members")
    .select("id, first_name, last_name, is_default, is_guest")
    .eq("tenant_id", company.tenant_id)
    .eq("company_id", company.id)
    .eq("is_default", false)
    .eq("is_guest", false)
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true })) as {
    data: PublicMemberRecord[] | null;
    error: { message?: string } | null;
  };

  if (error) {
    throw new Error(error.message ?? "No se pudieron buscar miembros.");
  }

  return (data ?? [])
    .map((member) => ({
      memberId: getStringValue(member.id),
      name: getMemberName(member),
    }))
    .filter(
      (member) =>
        member.memberId &&
        member.name &&
        normalizeSearchText(member.name).includes(normalizedQuery)
    )
    .slice(0, 8);
}

export async function getPublicWorkGroupsForMember(memberId: string) {
  const company = await getPublicWorkGroupCompany();
  const normalizedMemberId = getStringValue(memberId);

  if (!company || !normalizedMemberId) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  const { data: member, error: memberError } = (await supabase
    .from("treasury_members")
    .select("id, first_name, last_name, is_default, is_guest")
    .eq("tenant_id", company.tenant_id)
    .eq("company_id", company.id)
    .eq("id", normalizedMemberId)
    .eq("is_default", false)
    .eq("is_guest", false)
    .maybeSingle()) as {
    data: PublicMemberRecord | null;
    error: { message?: string } | null;
  };

  if (memberError) {
    throw new Error(memberError.message ?? "No se pudo cargar el miembro.");
  }

  const memberName = getMemberName(member);

  if (!member || !memberName) {
    return null;
  }

  const { data, error } = (await supabase
    .from("work_group_assignments")
    .select(
      "id, is_lead, work_group_id, treasury_member_id, work_groups:work_group_id(id, code, description, scheduled_at), treasury_members:treasury_member_id(id, first_name, last_name, is_default, is_guest)"
    )
    .eq("tenant_id", company.tenant_id)
    .eq("company_id", company.id)
    .order("created_at", { ascending: true })) as {
    data: PublicAssignmentRecord[] | null;
    error: { message?: string } | null;
  };

  if (error) {
    throw new Error(error.message ?? "No se pudieron cargar los grupos.");
  }

  const assignments = data ?? [];
  const selectedGroupIds = new Set(
    assignments
      .filter(
        (assignment) =>
          getStringValue(assignment.treasury_member_id) === normalizedMemberId
      )
      .map((assignment) => getStringValue(assignment.work_group_id))
      .filter(Boolean)
  );

  const groupsById = new Map<string, PublicWorkGroupSummary>();

  assignments.forEach((assignment) => {
    const groupId = getStringValue(assignment.work_group_id);

    if (!selectedGroupIds.has(groupId)) {
      return;
    }

    const group = getFirstRelation(assignment.work_groups);
    const assignmentMember = getFirstRelation(assignment.treasury_members);
    const assignmentMemberId = getStringValue(assignment.treasury_member_id);
    const assignmentMemberName = getMemberName(assignmentMember);
    const scheduledAt = getStringValue(group?.scheduled_at);
    const dateParts = getDateParts(scheduledAt);
    const currentGroup =
      groupsById.get(groupId) ??
      ({
        groupId,
        title: getGroupTitle(group),
        scheduledAt,
        dayLabel: dateParts.dayLabel,
        timeLabel: dateParts.timeLabel,
        periodLabel: dateParts.periodLabel,
        isLead: false,
        companions: [],
      } satisfies PublicWorkGroupSummary);

    if (assignmentMemberId === normalizedMemberId && assignment.is_lead) {
      currentGroup.isLead = true;
    }

    if (assignmentMemberId !== normalizedMemberId && assignmentMemberName) {
      currentGroup.companions.push({
        name: assignmentMemberName,
        isLead: Boolean(assignment.is_lead),
      });
    }

    groupsById.set(groupId, currentGroup);
  });

  const groups = Array.from(groupsById.values()).sort((left, right) => {
    const dateComparison = left.scheduledAt.localeCompare(right.scheduledAt);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return left.title.localeCompare(right.title, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return {
    memberId: normalizedMemberId,
    memberName,
    companyName: company.name ?? "SUSARROS",
    groupCount: groups.length,
    groups,
  } satisfies PublicWorkGroupMemberGroups;
}
