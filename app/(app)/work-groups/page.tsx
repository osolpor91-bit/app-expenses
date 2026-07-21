export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { workGroupEntity } from "@/lib/entities/workGroups/workGroupEntity";
import { getDictionary } from "@/lib/i18n/server";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";
import {
  type WorkGroupAssignmentGroup,
  type WorkGroupAssignmentMember,
  type WorkGroupAssignmentRecord,
} from "./WorkGroupAssignmentDialog";

type WorkGroupsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringValue(value: unknown) {
  return String(value ?? "").trim();
}

function getLabels(dict: Awaited<ReturnType<typeof getDictionary>>["dict"]) {
  return {
    assignGroups: dict.workGroups.assignGroups,
    assignGroupsTitle: dict.workGroups.assignGroupsTitle,
    workGroup: dict.workGroups.workGroup,
    searchMember: dict.workGroups.searchMember,
    searchMemberPlaceholder: dict.workGroups.searchMemberPlaceholder,
    selectedMembers: dict.workGroups.selectedMembers,
    leadMember: dict.workGroups.leadMember,
    markAsLead: dict.workGroups.markAsLead,
    noSelectedMembers: dict.workGroups.noSelectedMembers,
    noMemberResults: dict.workGroups.noMemberResults,
    typeToSearchMembers: dict.workGroups.typeToSearchMembers,
    selectWorkGroup: dict.workGroups.selectWorkGroup,
    add: dict.workGroups.add,
    remove: dict.workGroups.remove,
    accept: dict.common.accept,
    saving: dict.common.saving,
    close: dict.common.close,
    assignmentsSaved: dict.workGroups.assignmentsSaved,
    assignmentsError: dict.workGroups.assignmentsError,
    noWorkGroups: dict.workGroups.noWorkGroups,
    actions: dict.common.actions,
    viewAssignedGroups: dict.workGroups.viewAssignedGroups,
    viewAllGroups: dict.workGroups.viewAllGroups,
    membersWithWork: dict.workGroups.membersWithWork,
    deleteAllAssignments: dict.workGroups.deleteAllAssignments,
    confirmDeleteAllAssignments: dict.workGroups.confirmDeleteAllAssignments,
    deleteAllAssignmentsError: dict.workGroups.deleteAllAssignmentsError,
    assignmentsDeleted: dict.workGroups.assignmentsDeleted,
  };
}

export default async function WorkGroupsPage({
  searchParams,
}: WorkGroupsPageProps) {
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let groups: WorkGroupAssignmentGroup[] = [];
  let members: WorkGroupAssignmentMember[] = [];
  let assignments: WorkGroupAssignmentRecord[] = [];

  if (activeCompany) {
    const [groupsResult, membersResult, assignmentsResult] = await Promise.all([
      supabase
        .from("work_groups")
        .select("id, code, description")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .order("code", { ascending: true }),
      supabase
        .from("treasury_members")
        .select("id, first_name, last_name, is_default")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .eq("is_guest", false)
        .order("is_default", { ascending: false })
        .order("first_name", { ascending: true }),
      supabase
        .from("work_group_assignments")
        .select("work_group_id, treasury_member_id, is_lead")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id),
    ]);

    if (groupsResult.error) {
      throw new Error(
        `${dict.workGroups.errorReading}: ${groupsResult.error.message}`
      );
    }

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

    groups = (groupsResult.data ?? []).map((group) => ({
      id: getStringValue(group.id),
      code: getStringValue(group.code),
      description: getStringValue(group.description),
    }));

    members = (membersResult.data ?? []).map((member) => ({
      id: getStringValue(member.id),
      firstName: getStringValue(member.first_name),
      lastName: getStringValue(member.last_name),
      isDefault: Boolean(member.is_default),
    }));

    assignments = (assignmentsResult.data ?? []).map((assignment) => ({
      workGroupId: getStringValue(assignment.work_group_id),
      memberId: getStringValue(assignment.treasury_member_id),
      isLead: Boolean(assignment.is_lead),
    }));
  }

  return (
    <EntityListDetailPage
      entity={workGroupEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[720px]"
      workGroupActionsData={{
        groups,
        members,
        assignments,
        labels: getLabels(dict),
      }}
    />
  );
}
