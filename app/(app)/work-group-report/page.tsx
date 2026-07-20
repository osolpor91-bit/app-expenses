export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { Fragment } from "react";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";
import {
  buildReportGroups,
  getDays,
  getGroupsForCell,
  type ReportGroup,
  type WorkGroupAssignmentRecord,
} from "@/lib/workGroups/workGroupReport";

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
      <div className="space-y-2">
        <Link href="/reports" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToReports}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
            {dict.workGroups.reportTitle}
          </h1>

          <Link
            href="/work-group-report/pdf"
            className="btn-secondary-app px-3 py-1.5 text-xs"
            target="_blank"
          >
            PDF
          </Link>
        </div>
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
