export type TreasurySettlementMovement = {
  id: string;
  movementDate: string;
  accountDescription: string;
  comment: string;
  amount: number;
  paidByMemberId: string;
  settledByMemberId: string;
};

export type TreasurySettlementMember = {
  id: string;
  name: string;
  isDefault: boolean;
};

export type PendingTreasurySettlementMovement =
  TreasurySettlementMovement & {
    creditorMemberId: string;
  };

export type PendingTreasurySettlementGroup = {
  memberId: string;
  memberName: string;
  movementCount: number;
  totalAmount: number;
  movements: PendingTreasurySettlementMovement[];
};

function toAmount(value: unknown) {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : 0;
}

function sumAmounts(values: number[]) {
  const totalInCents = values.reduce(
    (total, value) => total + Math.round(toAmount(value) * 100),
    0
  );

  return totalInCents / 100;
}

export function getTreasuryMovementCreditorMemberId(
  movement: Pick<
    TreasurySettlementMovement,
    "paidByMemberId" | "settledByMemberId"
  >
) {
  return movement.settledByMemberId || movement.paidByMemberId;
}

export function buildPendingTreasurySettlementGroups({
  movements,
  members,
  defaultMemberId,
}: {
  movements: TreasurySettlementMovement[];
  members: TreasurySettlementMember[];
  defaultMemberId: string;
}): PendingTreasurySettlementGroup[] {
  const memberNames = new Map(
    members.map((member) => [member.id, member.name] as const)
  );
  const groupsByMemberId = new Map<
    string,
    PendingTreasurySettlementMovement[]
  >();

  movements.forEach((movement) => {
    const creditorMemberId =
      getTreasuryMovementCreditorMemberId(movement);

    if (
      !creditorMemberId ||
      creditorMemberId === defaultMemberId ||
      !memberNames.has(creditorMemberId)
    ) {
      return;
    }

    const pendingMovement = {
      ...movement,
      creditorMemberId,
    };
    const groupMovements = groupsByMemberId.get(creditorMemberId) ?? [];

    groupMovements.push(pendingMovement);
    groupsByMemberId.set(creditorMemberId, groupMovements);
  });

  return Array.from(groupsByMemberId.entries())
    .map(([memberId, groupMovements]) => {
      const movementsSortedByDate = [...groupMovements].sort((left, right) =>
        right.movementDate.localeCompare(left.movementDate)
      );

      return {
        memberId,
        memberName: memberNames.get(memberId) ?? "",
        movementCount: movementsSortedByDate.length,
        totalAmount: sumAmounts(
          movementsSortedByDate.map((movement) => movement.amount)
        ),
        movements: movementsSortedByDate,
      };
    })
    .sort((left, right) =>
      left.memberName.localeCompare(right.memberName, "es", {
        sensitivity: "base",
      })
    );
}

export function getPendingTreasurySettlementTotal(
  groups: PendingTreasurySettlementGroup[]
) {
  return sumAmounts(groups.map((group) => group.totalAmount));
}
