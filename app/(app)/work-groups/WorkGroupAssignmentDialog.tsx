"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { useSelectedEntityRecord } from "../components/EntitySelectionContext";
import { saveWorkGroupAssignmentsAction } from "./actions";

export type WorkGroupAssignmentGroup = {
  id: string;
  code: string;
  description: string;
};

export type WorkGroupAssignmentMember = {
  id: string;
  firstName: string;
  lastName: string;
  isDefault: boolean;
};

export type WorkGroupAssignmentRecord = {
  workGroupId: string;
  memberId: string;
  isLead: boolean;
};

export type WorkGroupAssignmentLabels = {
  assignGroups: string;
  assignGroupsTitle: string;
  workGroup: string;
  searchMember: string;
  searchMemberPlaceholder: string;
  selectedMembers: string;
  leadMember: string;
  markAsLead: string;
  noSelectedMembers: string;
  noMemberResults: string;
  typeToSearchMembers: string;
  selectWorkGroup: string;
  add: string;
  remove: string;
  accept: string;
  saving: string;
  close: string;
  assignmentsSaved: string;
  assignmentsError: string;
  noWorkGroups: string;
};

type WorkGroupAssignmentDialogProps = {
  groups: WorkGroupAssignmentGroup[];
  members: WorkGroupAssignmentMember[];
  assignments: WorkGroupAssignmentRecord[];
  labels: WorkGroupAssignmentLabels;
  selectedGroupId?: string;
};

function getMemberName(member: WorkGroupAssignmentMember) {
  if (member.isDefault) {
    return "TODOS";
  }

  return `${member.firstName} ${member.lastName}`.trim() || "-";
}

function getGroupLabel(group: WorkGroupAssignmentGroup) {
  const description = group.description.trim();

  return description ? `${group.code} - ${description}` : group.code;
}

function buildInitialSelection({
  groupId,
  assignments,
}: {
  groupId: string;
  assignments: WorkGroupAssignmentRecord[];
}) {
  return assignments
    .filter((assignment) => assignment.workGroupId === groupId)
    .map((assignment) => assignment.memberId);
}

function getInitialLeadMemberId({
  groupId,
  assignments,
}: {
  groupId: string;
  assignments: WorkGroupAssignmentRecord[];
}) {
  return (
    assignments.find(
      (assignment) => assignment.workGroupId === groupId && assignment.isLead
    )?.memberId ?? ""
  );
}

export default function WorkGroupAssignmentDialog({
  groups,
  members,
  assignments,
  labels,
  selectedGroupId,
}: WorkGroupAssignmentDialogProps) {
  const router = useRouter();
  const selectedRecord = useSelectedEntityRecord();
  const effectiveSelectedGroupId = selectedGroupId ?? selectedRecord?.id ?? "";
  const selectedGroup = groups.find(
    (group) => group.id === effectiveSelectedGroupId
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [leadMemberId, setLeadMemberId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const selectedMembers = selectedMemberIds
    .map((memberId) => membersById.get(memberId))
    .filter((member): member is WorkGroupAssignmentMember => Boolean(member));
  const hasDefaultMemberSelected = selectedMembers.some(
    (member) => member.isDefault
  );

  const normalizedSearchText = searchText.trim().toLowerCase();
  const memberResults = useMemo(() => {
    if (!normalizedSearchText) {
      return [];
    }

    const selectedIds = new Set(selectedMemberIds);

    return members
      .filter((member) => !selectedIds.has(member.id))
      .filter((member) =>
        getMemberName(member).toLowerCase().includes(normalizedSearchText)
      )
      .slice(0, 8);
  }, [members, normalizedSearchText, selectedMemberIds]);

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const portalTarget =
    typeof document === "undefined" ? null : document.body;

  function openDialog() {
    if (!selectedGroup) {
      return;
    }

    const initialMemberIds = buildInitialSelection({
      groupId: selectedGroup.id,
      assignments,
    });
    const initialDefaultMemberId = initialMemberIds.find(
      (memberId) => membersById.get(memberId)?.isDefault
    );

    setActiveGroupId(selectedGroup.id);
    setSelectedMemberIds(
      initialDefaultMemberId ? [initialDefaultMemberId] : initialMemberIds
    );
    setLeadMemberId(
      initialDefaultMemberId ||
        getInitialLeadMemberId({
          groupId: selectedGroup.id,
          assignments,
        })
    );
    setSearchText("");
    setIsOpen(true);
    setMessage(null);
    setErrorMessage(null);
  }

  function addMember(memberId: string) {
    const member = membersById.get(memberId);

    if (member?.isDefault) {
      setSelectedMemberIds([memberId]);
      setLeadMemberId(memberId);
      setSearchText("");
      return;
    }

    setSelectedMemberIds((currentIds) => {
      const idsWithoutDefaultMember = currentIds.filter(
        (currentId) => !membersById.get(currentId)?.isDefault
      );

      return idsWithoutDefaultMember.includes(memberId)
        ? idsWithoutDefaultMember
        : [...idsWithoutDefaultMember, memberId];
    });
    setLeadMemberId((currentLeadMemberId) =>
      membersById.get(currentLeadMemberId)?.isDefault ? "" : currentLeadMemberId
    );
    setSearchText("");
  }

  function removeMember(memberId: string) {
    setSelectedMemberIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== memberId)
    );
    setLeadMemberId((currentLeadMemberId) =>
      currentLeadMemberId === memberId ? "" : currentLeadMemberId
    );
  }

  async function saveAssignments() {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const result = await saveWorkGroupAssignmentsAction({
      workGroupId: activeGroupId,
      memberIds: selectedMemberIds,
      leadMemberId,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(`${labels.assignmentsError}: ${result.error}`);
      return;
    }

    setMessage(labels.assignmentsSaved);
    setIsOpen(false);
    router.refresh();
  }

  const dialog = isOpen ? (
    <div className="fixed inset-0 z-[300] flex items-stretch justify-center bg-black/35 p-0 sm:items-center sm:px-4 sm:py-6">
      <div className="flex h-full w-full flex-col bg-app p-3 shadow-xl sm:h-auto sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-primary-app sm:p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-base font-black uppercase tracking-tight text-primary-app sm:text-lg">
            {labels.assignGroupsTitle}
          </h2>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full border border-app-border px-3 py-1 text-xs font-semibold text-primary-app"
            disabled={isSubmitting}
          >
            {labels.close}
          </button>
        </div>

        {!activeGroup ? (
          <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
            {groups.length === 0 ? labels.noWorkGroups : labels.selectWorkGroup}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
            <div className="rounded-lg border border-app-border bg-app-soft px-3 py-2">
              <div className="text-[11px] font-semibold uppercase text-app-muted sm:text-xs">
                {labels.workGroup}
              </div>
              <div className="mt-1 text-xs font-bold leading-tight text-primary-app sm:text-sm">
                {getGroupLabel(activeGroup)}
              </div>
            </div>

            <label className="block text-xs font-semibold text-app">
              {labels.searchMember}
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="input-app mt-1 h-10 px-3 py-2 text-base sm:h-11"
                placeholder={labels.searchMemberPlaceholder}
                disabled={isSubmitting || hasDefaultMemberSelected}
                autoComplete="off"
              />
            </label>

            <div className="min-h-12 rounded-lg border border-app-border bg-app-soft p-2 sm:min-h-[4rem]">
              {hasDefaultMemberSelected ? (
                <div className="px-2 py-2 text-sm text-app-muted">
                  {labels.noMemberResults}
                </div>
              ) : !normalizedSearchText ? (
                <div className="px-2 py-2 text-sm text-app-muted">
                  {labels.typeToSearchMembers}
                </div>
              ) : memberResults.length === 0 ? (
                <div className="px-2 py-2 text-sm text-app-muted">
                  {labels.noMemberResults}
                </div>
              ) : (
                <div className="space-y-1">
                  {memberResults.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => addMember(member.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-md bg-app px-3 py-2 text-left text-sm font-semibold text-app transition hover:bg-white"
                      disabled={isSubmitting}
                    >
                      <span>{getMemberName(member)}</span>
                      <span className="text-xs text-primary-app">
                        {labels.add}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-app-border bg-app">
              <div className="border-b border-app-border bg-app-soft px-3 py-2 text-xs font-semibold uppercase text-app-muted">
                {labels.selectedMembers}
              </div>

              {selectedMembers.length === 0 ? (
                <div className="p-3 text-sm text-app-muted">
                  {labels.noSelectedMembers}
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {selectedMembers.map((member) => (
                    <div key={member.id} className="grid gap-2 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-sm font-semibold ${
                            leadMemberId === member.id || member.isDefault
                              ? "text-red-700"
                              : "text-app"
                          }`}
                        >
                          {getMemberName(member)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="rounded-full border border-app-border px-3 py-1 text-xs font-semibold text-primary-app"
                          disabled={isSubmitting}
                        >
                          {labels.remove}
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-app-muted">
                        <input
                          type="radio"
                          name="leadMember"
                          checked={leadMemberId === member.id || member.isDefault}
                          onChange={() => setLeadMemberId(member.id)}
                          disabled={isSubmitting || member.isDefault}
                        />
                        {leadMemberId === member.id || member.isDefault
                          ? labels.leadMember
                          : labels.markAsLead}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                {message}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-secondary-app px-4 py-2 text-sm"
                disabled={isSubmitting}
              >
                {labels.close}
              </button>

              <button
                type="button"
                onClick={saveAssignments}
                className="btn-primary-app px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || !activeGroupId}
              >
                {isSubmitting ? labels.saving : labels.accept}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary-app transition hover:bg-app-soft disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!selectedGroup}
        title={selectedGroup ? undefined : labels.selectWorkGroup}
      >
        {labels.assignGroups}
      </button>

      {dialog && portalTarget ? createPortal(dialog, portalTarget) : null}
    </>
  );
}
