import {
  formatDateValue,
  formatDecimalValue,
} from "@/lib/formatters/fieldFormatters";
import {
  getPendingTreasurySettlementTotal,
  type PendingTreasurySettlementGroup,
} from "@/lib/treasury/treasurySettlements";

type PendingSettlementGroupsLabels = {
  movements: string;
  total: string;
  grandTotal: string;
  noComment: string;
};

type PendingSettlementGroupsProps = {
  groups: PendingTreasurySettlementGroup[];
  labels: PendingSettlementGroupsLabels;
};

export default function PendingSettlementGroups({
  groups,
  labels,
}: PendingSettlementGroupsProps) {
  return (
    <div className="w-full max-w-[430px] space-y-3">
      {groups.map((group) => (
        <section
          key={group.memberId}
          className="overflow-hidden rounded-xl border border-primary-app bg-white"
        >
          <header className="flex items-center justify-between gap-3 bg-app-soft px-3 py-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-primary-app">
                {group.memberName}
              </h2>
              <p className="text-[11px] text-app-muted">
                {group.movementCount} {labels.movements}
              </p>
            </div>

            <span className="whitespace-nowrap text-sm font-bold tabular-nums text-primary-app">
              {formatDecimalValue(group.totalAmount)}
            </span>
          </header>

          <div className="divide-y divide-app-border">
            {group.movements.map((movement) => (
              <article
                key={movement.id}
                className="grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="whitespace-nowrap font-semibold text-app">
                      {formatDateValue(movement.movementDate)}
                    </span>
                    <span className="truncate text-app-muted">
                      {movement.accountDescription || "-"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-app-muted">
                    {movement.comment || labels.noComment}
                  </p>
                </div>

                <span className="self-center whitespace-nowrap font-bold tabular-nums text-primary-app">
                  {formatDecimalValue(movement.amount)}
                </span>
              </article>
            ))}
          </div>

          <footer className="flex items-center justify-between border-t border-primary-app bg-app-soft px-3 py-1.5 text-xs font-bold text-primary-app">
            <span>{labels.total}</span>
            <span className="tabular-nums">
              {formatDecimalValue(group.totalAmount)}
            </span>
          </footer>
        </section>
      ))}

      <div className="flex items-center justify-between rounded-xl border border-primary-app bg-app-soft px-3 py-2 text-sm font-bold text-primary-app">
        <span>{labels.grandTotal}</span>
        <span className="tabular-nums">
          {formatDecimalValue(getPendingTreasurySettlementTotal(groups))}
        </span>
      </div>
    </div>
  );
}
