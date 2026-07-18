export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";

import AttendanceRegisterClient, {
  type AttendanceMember,
  type AttendanceRecord,
} from "./AttendanceRegisterClient";

function getStringValue(value: unknown) {
  return String(value ?? "").trim();
}

function getLabels(dict: Awaited<ReturnType<typeof getDictionary>>["dict"]) {
  return {
    date: dict.attendance.date,
    period: dict.attendance.period,
    morning: dict.attendance.morning,
    afternoon: dict.attendance.afternoon,
    searchMember: dict.attendance.searchMember,
    searchMemberPlaceholder: dict.attendance.searchMemberPlaceholder,
    selectedMembers: dict.attendance.selectedMembers,
    comment: dict.attendance.comment,
    commentPlaceholder: dict.attendance.commentPlaceholder,
    typeToSearchMembers: dict.attendance.typeToSearchMembers,
    noMemberResults: dict.attendance.noMemberResults,
    incompatibleAttendanceHelp: dict.attendance.incompatibleAttendanceHelp,
    noSelectedMembers: dict.attendance.noSelectedMembers,
    add: dict.attendance.add,
    remove: dict.attendance.remove,
    accept: dict.common.accept,
    saving: dict.common.saving,
    saved: dict.attendance.saved,
    saveError: dict.attendance.saveError,
    commentRequired: dict.attendance.commentRequired,
  };
}

export default async function AttendanceRegisterPage() {
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let members: AttendanceMember[] = [];
  let attendances: AttendanceRecord[] = [];

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
        .select("attendance_date, period, treasury_member_id, comment")
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id),
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

    members = (membersResult.data ?? []).map((member) => ({
      id: getStringValue(member.id),
      firstName: getStringValue(member.first_name),
      lastName: getStringValue(member.last_name),
    }));

    attendances = (attendanceResult.data ?? []).map((attendance) => ({
      attendanceDate: getStringValue(attendance.attendance_date),
      period: getStringValue(attendance.period),
      memberId: getStringValue(attendance.treasury_member_id),
      comment: getStringValue(attendance.comment),
    }));
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <Link href="/configurations" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToConfigurations}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {dict.attendance.title}
        </h1>
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.attendance.noActiveCompanyDescription}
        </div>
      ) : (
        <AttendanceRegisterClient
          members={members}
          attendances={attendances}
          labels={getLabels(dict)}
        />
      )}
    </section>
  );
}
