"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  formatDateValue,
  formatDecimalValue,
} from "@/lib/formatters/fieldFormatters";
import type { PendingTreasurySettlementGroup } from "@/lib/treasury/treasurySettlements";

import AutocompleteInput from "../../components/AutocompleteInput";
import type { TreasuryMemberOption } from "../TreasuryMovementModal";
import { settleTreasuryMovementsAction } from "../actions";

type SettlePaymentsLabels = {
  paidBy: string;
  paidByPlaceholder: string;
  selectAll: string;
  selected: string;
  movements: string;
  total: string;
  settle: string;
  settling: string;
  noComment: string;
  cannotPaySelf: string;
  selectAtLeastOne: string;
  selectPayer: string;
  confirmClose: string;
  confirmTransfer: string;
  successClosed: string;
  successTransferred: string;
  error: string;
};

type SettlePaymentsClientProps = {
  groups: PendingTreasurySettlementGroup[];
  memberOptions: TreasuryMemberOption[];
  defaultMemberId: string;
  labels: SettlePaymentsLabels;
};

function applyTemplate(
  template: string,
  values: Record<string, string | number>
) {
  return Object.entries(values).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export default function SettlePaymentsClient({
  groups,
  memberOptions,
  defaultMemberId,
  labels,
}: SettlePaymentsClientProps) {
  const router = useRouter();
  const [settledByMemberId, setSettledByMemberId] =
    useState(defaultMemberId);
  const [selectedMovementIds, setSelectedMovementIds] = useState<
    Set<string>
  >(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const movementsById = useMemo(
    () =>
      new Map(
        groups.flatMap((group) =>
          group.movements.map((movement) => [movement.id, movement] as const)
        )
      ),
    [groups]
  );
  const selectedTotal = useMemo(
    () =>
      Array.from(selectedMovementIds).reduce(
        (total, movementId) =>
          total + (movementsById.get(movementId)?.amount ?? 0),
        0
      ),
    [movementsById, selectedMovementIds]
  );
  const selectedPayer = memberOptions.find(
    (member) => member.value === settledByMemberId
  );

  function updatePayer(memberId: string) {
    setSettledByMemberId(memberId);
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedMovementIds((currentIds) => {
      const nextIds = new Set(currentIds);

      groups
        .find((group) => group.memberId === memberId)
        ?.movements.forEach((movement) => nextIds.delete(movement.id));

      return nextIds;
    });
  }

  function toggleMovement(movementId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedMovementIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(movementId)) {
        nextIds.delete(movementId);
      } else {
        nextIds.add(movementId);
      }

      return nextIds;
    });
  }

  function toggleGroup(group: PendingTreasurySettlementGroup) {
    if (group.memberId === settledByMemberId) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setSelectedMovementIds((currentIds) => {
      const nextIds = new Set(currentIds);
      const isEntireGroupSelected = group.movements.every((movement) =>
        nextIds.has(movement.id)
      );

      group.movements.forEach((movement) => {
        if (isEntireGroupSelected) {
          nextIds.delete(movement.id);
        } else {
          nextIds.add(movement.id);
        }
      });

      return nextIds;
    });
  }

  async function settleSelectedMovements() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!settledByMemberId) {
      setErrorMessage(labels.selectPayer);
      return;
    }

    if (selectedMovementIds.size === 0) {
      setErrorMessage(labels.selectAtLeastOne);
      return;
    }

    const formattedTotal = formatDecimalValue(selectedTotal);
    const confirmationTemplate =
      settledByMemberId === defaultMemberId
        ? labels.confirmClose
        : labels.confirmTransfer;
    const confirmationMessage = applyTemplate(confirmationTemplate, {
      member: selectedPayer?.label ?? "",
      count: selectedMovementIds.size,
      amount: formattedTotal,
    });

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await settleTreasuryMovementsAction({
        movementIds: Array.from(selectedMovementIds),
        settledByMemberId,
      });

      if (!result.ok) {
        setErrorMessage(`${labels.error}: ${result.error}`);
        return;
      }

      setSelectedMovementIds(new Set());
      setSuccessMessage(
        applyTemplate(
          result.data.isClosed
            ? labels.successClosed
            : labels.successTransferred,
          {
            member: result.data.settledByMemberName,
            count: result.data.movementCount,
            amount: formatDecimalValue(result.data.totalAmount),
          }
        )
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      setErrorMessage(`${labels.error}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[430px] space-y-3">
      <div className="rounded-xl border border-app-border bg-app-soft p-3">
        <label className="block text-xs font-semibold text-app">
          {labels.paidBy}
          <AutocompleteInput
            value={settledByMemberId}
            options={memberOptions}
            onValueChange={updatePayer}
            className="input-app mt-1 px-3 py-2 text-sm"
            placeholder={labels.paidByPlaceholder}
            required
            disabled={isSubmitting}
          />
        </label>
      </div>

      {groups.map((group) => {
        const isOwnDebt = group.memberId === settledByMemberId;
        const isEntireGroupSelected =
          !isOwnDebt &&
          group.movements.every((movement) =>
            selectedMovementIds.has(movement.id)
          );

        return (
          <section
            key={group.memberId}
            className={[
              "overflow-hidden rounded-xl border bg-white",
              isOwnDebt
                ? "border-app-border opacity-60"
                : "border-primary-app",
            ].join(" ")}
          >
            <header className="flex items-center gap-2 bg-app-soft px-3 py-2">
              <input
                type="checkbox"
                checked={isEntireGroupSelected}
                onChange={() => toggleGroup(group)}
                disabled={isOwnDebt || isSubmitting}
                className="size-4 accent-[var(--color-primary)]"
                aria-label={`${labels.selectAll}: ${group.memberName}`}
              />

              <button
                type="button"
                onClick={() => toggleGroup(group)}
                disabled={isOwnDebt || isSubmitting}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left disabled:cursor-not-allowed"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-primary-app">
                    {group.memberName}
                  </span>
                  <span className="block text-[11px] text-app-muted">
                    {isOwnDebt
                      ? labels.cannotPaySelf
                      : `${group.movementCount} ${labels.movements}`}
                  </span>
                </span>
                <span className="whitespace-nowrap text-sm font-bold tabular-nums text-primary-app">
                  {formatDecimalValue(group.totalAmount)}
                </span>
              </button>
            </header>

            <div className="divide-y divide-app-border">
              {group.movements.map((movement) => (
                <label
                  key={movement.id}
                  className={[
                    "grid grid-cols-[auto_1fr_auto] items-center gap-x-2 px-3 py-2 text-xs",
                    isOwnDebt
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:bg-app-soft",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={selectedMovementIds.has(movement.id)}
                    onChange={() => toggleMovement(movement.id)}
                    disabled={isOwnDebt || isSubmitting}
                    className="size-4 accent-[var(--color-primary)]"
                  />

                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="whitespace-nowrap font-semibold text-app">
                        {formatDateValue(movement.movementDate)}
                      </span>
                      <span className="truncate text-app-muted">
                        {movement.accountDescription || "-"}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-app-muted">
                      {movement.comment || labels.noComment}
                    </span>
                  </span>

                  <span className="whitespace-nowrap font-bold tabular-nums text-primary-app">
                    {formatDecimalValue(movement.amount)}
                  </span>
                </label>
              ))}
            </div>
          </section>
        );
      })}

      <div className="sticky bottom-2 space-y-2 rounded-xl border border-primary-app bg-white p-3 shadow-lg">
        <div className="flex items-center justify-between text-sm font-bold text-primary-app">
          <span>
            {labels.selected}: {selectedMovementIds.size}
          </span>
          <span className="tabular-nums">
            {labels.total}: {formatDecimalValue(selectedTotal)}
          </span>
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
            {successMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={settleSelectedMovements}
          disabled={
            isSubmitting ||
            !settledByMemberId ||
            selectedMovementIds.size === 0
          }
          className="btn-primary-app w-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? labels.settling : labels.settle}
        </button>
      </div>
    </div>
  );
}
