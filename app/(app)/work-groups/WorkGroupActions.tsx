"use client";

import Link from "next/link";

import { useSelectedEntityRecord } from "../components/EntitySelectionContext";
import WorkGroupAssignmentDialog, {
  type WorkGroupAssignmentGroup,
  type WorkGroupAssignmentLabels,
  type WorkGroupAssignmentMember,
  type WorkGroupAssignmentRecord,
} from "./WorkGroupAssignmentDialog";

type WorkGroupActionsLabels = WorkGroupAssignmentLabels & {
  viewAssignedGroups: string;
  viewAllGroups: string;
};

type WorkGroupActionsProps = {
  groups: WorkGroupAssignmentGroup[];
  members: WorkGroupAssignmentMember[];
  assignments: WorkGroupAssignmentRecord[];
  labels: WorkGroupActionsLabels;
};

export default function WorkGroupActions({
  groups,
  members,
  assignments,
  labels,
}: WorkGroupActionsProps) {
  const selectedRecord = useSelectedEntityRecord();
  const selectedGroupId = selectedRecord?.id ?? "";

  return (
    <>
      <WorkGroupAssignmentDialog
        groups={groups}
        members={members}
        assignments={assignments}
        labels={labels}
      />

      {selectedGroupId ? (
        <Link
          href={{
            pathname: "/work-group-assignments",
            query: {
              groupId: selectedGroupId,
            },
          }}
          className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary-app transition hover:bg-app-soft"
        >
          {labels.viewAssignedGroups}
        </Link>
      ) : (
        <button
          type="button"
          disabled
          title={labels.selectWorkGroup}
          className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary-app opacity-60 disabled:cursor-not-allowed"
        >
          {labels.viewAssignedGroups}
        </button>
      )}

      <Link
        href="/work-group-assignments"
        className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary-app transition hover:bg-app-soft"
      >
        {labels.viewAllGroups}
      </Link>
    </>
  );
}
