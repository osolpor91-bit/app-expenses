"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  type SelectedEntityRecord,
  useSelectedEntityRecord,
} from "../components/EntitySelectionContext";
import WorkGroupAssignmentDialog, {
  type WorkGroupAssignmentGroup,
  type WorkGroupAssignmentLabels,
  type WorkGroupAssignmentMember,
  type WorkGroupAssignmentRecord,
} from "./WorkGroupAssignmentDialog";
import { deleteAllWorkGroupAssignmentsAction } from "./actions";

export type WorkGroupActionsLabels = WorkGroupAssignmentLabels & {
  actions: string;
  viewAssignedGroups: string;
  viewAllGroups: string;
  membersWithWork: string;
  deleteAllAssignments: string;
  confirmDeleteAllAssignments: string;
  deleteAllAssignmentsError: string;
  assignmentsDeleted: string;
  saving: string;
};

type WorkGroupActionsProps = {
  groups: WorkGroupAssignmentGroup[];
  members: WorkGroupAssignmentMember[];
  assignments: WorkGroupAssignmentRecord[];
  labels: WorkGroupActionsLabels;
  selectedRecord?: SelectedEntityRecord | null;
};

export type WorkGroupActionsData = Omit<
  WorkGroupActionsProps,
  "selectedRecord"
>;

export default function WorkGroupActions({
  groups,
  members,
  assignments,
  labels,
  selectedRecord: selectedRecordFromProps,
}: WorkGroupActionsProps) {
  const router = useRouter();
  const selectedRecordFromContext = useSelectedEntityRecord();
  const selectedRecord = selectedRecordFromProps ?? selectedRecordFromContext;
  const selectedGroupId = selectedRecord?.id ?? "";
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeletingAssignments, setIsDeletingAssignments] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function deleteAllAssignments() {
    setIsActionsOpen(false);

    const confirmed = window.confirm(labels.confirmDeleteAllAssignments);

    if (!confirmed) {
      return;
    }

    setIsDeletingAssignments(true);
    setMessage(null);

    const result = await deleteAllWorkGroupAssignmentsAction();

    setIsDeletingAssignments(false);

    if (!result.ok) {
      setMessage(`${labels.deleteAllAssignmentsError}: ${result.error}`);
      return;
    }

    setMessage(labels.assignmentsDeleted);
    router.refresh();
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsActionsOpen((currentValue) => !currentValue)}
          disabled={isDeletingAssignments}
          className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeletingAssignments ? labels.saving : labels.actions}
        </button>

        {isActionsOpen ? (
          <div className="absolute left-0 z-[120] mt-2 min-w-60 rounded-xl border border-app-border bg-app p-2 shadow-xl">
            <button
              type="button"
              onClick={deleteAllAssignments}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              {labels.deleteAllAssignments}
            </button>
          </div>
        ) : null}
      </div>

      <WorkGroupAssignmentDialog
        groups={groups}
        members={members}
        assignments={assignments}
        labels={labels}
        selectedGroupId={selectedGroupId}
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

      <Link
        href="/reports/work-members"
        className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary-app transition hover:bg-app-soft"
      >
        {labels.membersWithWork}
      </Link>

      {message ? (
        <span className="text-xs font-medium text-app-muted">{message}</span>
      ) : null}
    </>
  );
}
