export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { getDictionary } from "@/lib/i18n/server";

import { loadTreasurySettlementViewData } from "../settlementData";
import SettlePaymentsClient from "./SettlePaymentsClient";

export default async function SettleTreasuryPaymentsPage() {
  const [data, { dict }] = await Promise.all([
    loadTreasurySettlementViewData(),
    getDictionary(),
  ]);
  const labels = dict.treasurySettlements;

  return (
    <section className="max-w-[520px] space-y-3">
      <div className="space-y-1">
        <Link href="/treasury-general" className="link-app inline-block text-sm">
          ← {labels.backToTreasuryGeneral}
        </Link>

        <h1 className="text-base font-semibold leading-tight text-primary-app">
          {labels.settleTitle}
        </h1>

        <p className="max-w-md text-xs text-app-muted">
          {labels.settleHelpText}
        </p>
      </div>

      <Link
        href="/treasury-general/pending-settlements"
        className="btn-secondary-app px-3 py-1.5 text-xs"
      >
        {labels.viewPendingAction}
      </Link>

      {!data.hasActiveCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {labels.noActiveCompany}
        </div>
      ) : !data.defaultMemberId ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          {labels.noDefaultMember}
        </div>
      ) : data.groups.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {labels.emptyList}
        </div>
      ) : (
        <SettlePaymentsClient
          groups={data.groups}
          memberOptions={data.memberOptions}
          defaultMemberId={data.defaultMemberId}
          labels={{
            paidBy: labels.paidBy,
            paidByPlaceholder: labels.paidByPlaceholder,
            selectAll: labels.selectAll,
            selected: labels.selected,
            movements: labels.movements,
            total: labels.total,
            settle: labels.settle,
            settling: labels.settling,
            noComment: labels.noComment,
            cannotPaySelf: labels.cannotPaySelf,
            selectAtLeastOne: labels.selectAtLeastOne,
            selectPayer: labels.selectPayer,
            confirmClose: labels.confirmClose,
            confirmTransfer: labels.confirmTransfer,
            successClosed: labels.successClosed,
            successTransferred: labels.successTransferred,
            error: labels.error,
          }}
        />
      )}
    </section>
  );
}
