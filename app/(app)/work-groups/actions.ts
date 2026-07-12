"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";

type SaveWorkGroupAssignmentsInput = {
  workGroupId: string;
  memberIds: string[];
  leadMemberId?: string | null;
};

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

export async function saveWorkGroupAssignmentsAction({
  workGroupId,
  memberIds,
  leadMemberId,
}: SaveWorkGroupAssignmentsInput): Promise<EntityOperationResult<null>> {
  const normalizedWorkGroupId = workGroupId.trim();
  const normalizedMemberIds = uniqueIds(memberIds);
  const normalizedLeadMemberId = leadMemberId?.trim() ?? "";
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError("Selecciona una empresa activa.");
  }

  if (!normalizedWorkGroupId) {
    return entityOperationError("Selecciona un grupo de trabajo.");
  }

  if (
    normalizedLeadMemberId &&
    !normalizedMemberIds.includes(normalizedLeadMemberId)
  ) {
    return entityOperationError("El encargado debe estar entre los miembros.");
  }

  const { data: workGroup, error: workGroupError } = await supabase
    .from("work_groups")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .eq("id", normalizedWorkGroupId)
    .single();

  if (workGroupError || !workGroup) {
    return entityOperationError("No se ha podido validar el grupo de trabajo.");
  }

  let defaultMemberId = "";

  if (normalizedMemberIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from("treasury_members")
      .select("id, is_default")
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .eq("is_guest", false)
      .in("id", normalizedMemberIds);

    if (membersError) {
      return entityOperationError(membersError.message);
    }

    if ((members ?? []).length !== normalizedMemberIds.length) {
      return entityOperationError(
        "Alguno de los miembros seleccionados no es válido."
      );
    }

    const hasDefaultMember = (members ?? []).some((member) =>
      Boolean(member.is_default)
    );
    defaultMemberId =
      (members ?? []).find((member) => Boolean(member.is_default))?.id ?? "";

    if (hasDefaultMember && normalizedMemberIds.length > 1) {
      return entityOperationError(
        "El miembro predeterminado debe asignarse solo."
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("work_group_assignments")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .eq("work_group_id", normalizedWorkGroupId);

  if (deleteError) {
    return entityOperationError(deleteError.message);
  }

  if (normalizedMemberIds.length > 0) {
    const now = new Date().toISOString();
    const assignments = normalizedMemberIds.map((memberId) => ({
      tenant_id: tenant.id,
      company_id: activeCompany.id,
      work_group_id: normalizedWorkGroupId,
      treasury_member_id: memberId,
      is_lead:
        memberId === normalizedLeadMemberId || memberId === defaultMemberId,
      updated_at: now,
    }));

    const { error: insertError } = await supabase
      .from("work_group_assignments")
      .insert(assignments);

    if (insertError) {
      return entityOperationError(insertError.message);
    }
  }

  revalidatePath("/work-groups");
  revalidatePath("/work-group-assignments");
  revalidatePath("/work-group-report");

  return entityOperationOk(null);
}

export async function deleteAllWorkGroupAssignmentsAction(): Promise<
  EntityOperationResult<null>
> {
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError("Selecciona una empresa activa.");
  }

  const { error } = await supabase
    .from("work_group_assignments")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id);

  if (error) {
    return entityOperationError(error.message);
  }

  revalidatePath("/work-groups");
  revalidatePath("/work-group-assignments");
  revalidatePath("/work-group-report");

  return entityOperationOk(null);
}
