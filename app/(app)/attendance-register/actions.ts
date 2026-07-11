"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";

const attendancePeriods = ["morning", "afternoon", "full_day"] as const;

type AttendancePeriod = (typeof attendancePeriods)[number];

type SaveAttendanceInput = {
  attendanceDate: string;
  period: string;
  memberIds: string[];
  comment?: string | null;
};

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function isAttendancePeriod(value: string): value is AttendancePeriod {
  return attendancePeriods.includes(value as AttendancePeriod);
}

function isDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function saveAttendanceAction({
  attendanceDate,
  period,
  memberIds,
  comment,
}: SaveAttendanceInput): Promise<EntityOperationResult<null>> {
  const normalizedDate = attendanceDate.trim();
  const normalizedPeriod = period.trim();
  const normalizedMemberIds = uniqueIds(memberIds);
  const normalizedComment = comment?.trim() || null;
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError("Selecciona una empresa activa.");
  }

  if (!isDateValue(normalizedDate)) {
    return entityOperationError("Indica una fecha valida.");
  }

  if (!isAttendancePeriod(normalizedPeriod)) {
    return entityOperationError("Selecciona un tramo valido.");
  }

  if (normalizedMemberIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from("treasury_members")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .eq("is_guest", false)
      .eq("is_default", false)
      .in("id", normalizedMemberIds);

    if (membersError) {
      return entityOperationError(membersError.message);
    }

    if ((members ?? []).length !== normalizedMemberIds.length) {
      return entityOperationError(
        "Alguno de los miembros seleccionados no es valido."
      );
    }

    const conflictingPeriods =
      normalizedPeriod === "full_day" ? ["morning", "afternoon"] : ["full_day"];
    const { data: conflictingAttendances, error: conflictError } =
      await supabase
        .from("member_attendance")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .eq("attendance_date", normalizedDate)
        .in("period", conflictingPeriods)
        .in("treasury_member_id", normalizedMemberIds)
        .limit(1);

    if (conflictError) {
      return entityOperationError(conflictError.message);
    }

    if ((conflictingAttendances ?? []).length > 0) {
      return entityOperationError(
        "No puedes registrar Todo el dia si ya existe Manana o Tarde, ni registrar Manana o Tarde si ya existe Todo el dia."
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("member_attendance")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("company_id", activeCompany.id)
    .eq("attendance_date", normalizedDate)
    .eq("period", normalizedPeriod);

  if (deleteError) {
    return entityOperationError(deleteError.message);
  }

  if (normalizedMemberIds.length > 0) {
    const now = new Date().toISOString();
    const records = normalizedMemberIds.map((memberId) => ({
      tenant_id: tenant.id,
      company_id: activeCompany.id,
      attendance_date: normalizedDate,
      period: normalizedPeriod,
      treasury_member_id: memberId,
      comment: normalizedComment,
      updated_at: now,
    }));

    const { error: insertError } = await supabase
      .from("member_attendance")
      .insert(records);

    if (insertError) {
      return entityOperationError(insertError.message);
    }
  }

  revalidatePath("/attendance-register");
  revalidatePath("/attendance-report");

  return entityOperationOk(null);
}
