"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { saveAttendanceAction } from "./actions";

export type AttendanceMember = {
  id: string;
  firstName: string;
  lastName: string;
};

export type AttendanceRecord = {
  attendanceDate: string;
  period: string;
  memberId: string;
  comment: string;
};

export type AttendanceLabels = {
  date: string;
  period: string;
  morning: string;
  afternoon: string;
  fullDay: string;
  searchMember: string;
  searchMemberPlaceholder: string;
  selectedMembers: string;
  comment: string;
  commentPlaceholder: string;
  typeToSearchMembers: string;
  noMemberResults: string;
  incompatibleAttendanceHelp: string;
  noSelectedMembers: string;
  add: string;
  remove: string;
  accept: string;
  saving: string;
  saved: string;
  saveError: string;
};

type AttendanceRegisterClientProps = {
  members: AttendanceMember[];
  attendances: AttendanceRecord[];
  labels: AttendanceLabels;
};

type AttendancePeriod = "morning" | "afternoon" | "full_day";

function getTodayValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMemberName(member: AttendanceMember) {
  return `${member.firstName} ${member.lastName}`.trim() || "-";
}

function getInitialMemberIds({
  attendances,
  attendanceDate,
  period,
}: {
  attendances: AttendanceRecord[];
  attendanceDate: string;
  period: string;
}) {
  return attendances
    .filter(
      (attendance) =>
        attendance.attendanceDate === attendanceDate &&
        attendance.period === period
    )
    .map((attendance) => attendance.memberId);
}

function getInitialComment({
  attendances,
  attendanceDate,
  period,
}: {
  attendances: AttendanceRecord[];
  attendanceDate: string;
  period: string;
}) {
  return (
    attendances.find(
      (attendance) =>
        attendance.attendanceDate === attendanceDate &&
        attendance.period === period &&
        attendance.comment
    )?.comment ?? ""
  );
}

function hasIncompatibleAttendance({
  attendances,
  attendanceDate,
  period,
  memberId,
}: {
  attendances: AttendanceRecord[];
  attendanceDate: string;
  period: AttendancePeriod;
  memberId: string;
}) {
  const incompatiblePeriods =
    period === "full_day" ? ["morning", "afternoon"] : ["full_day"];

  return attendances.some(
    (attendance) =>
      attendance.attendanceDate === attendanceDate &&
      attendance.memberId === memberId &&
      incompatiblePeriods.includes(attendance.period)
  );
}

export default function AttendanceRegisterClient({
  members,
  attendances,
  labels,
}: AttendanceRegisterClientProps) {
  const router = useRouter();
  const [attendanceDate, setAttendanceDate] = useState(getTodayValue);
  const [period, setPeriod] = useState<AttendancePeriod>("morning");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() =>
    getInitialMemberIds({
      attendances,
      attendanceDate: getTodayValue(),
      period: "morning",
    })
  );
  const [comment, setComment] = useState(() =>
    getInitialComment({
      attendances,
      attendanceDate: getTodayValue(),
      period: "morning",
    })
  );
  const [searchText, setSearchText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  );

  function loadSelection(nextDate: string, nextPeriod: AttendancePeriod) {
    setSelectedMemberIds(
      getInitialMemberIds({
        attendances,
        attendanceDate: nextDate,
        period: nextPeriod,
      })
    );
    setSearchText("");
    setComment(
      getInitialComment({
        attendances,
        attendanceDate: nextDate,
        period: nextPeriod,
      })
    );
    setMessage(null);
    setErrorMessage(null);
  }

  function changeAttendanceDate(nextDate: string) {
    setAttendanceDate(nextDate);
    loadSelection(nextDate, period);
  }

  function changePeriod(nextPeriod: AttendancePeriod) {
    setPeriod(nextPeriod);
    loadSelection(attendanceDate, nextPeriod);
  }

  const selectedMembers = selectedMemberIds
    .map((memberId) => membersById.get(memberId))
    .filter((member): member is AttendanceMember => Boolean(member));

  const normalizedSearchText = searchText.trim().toLowerCase();
  const memberResults = useMemo(() => {
    if (!normalizedSearchText) {
      return [];
    }

    const selectedIds = new Set(selectedMemberIds);

    return members
      .filter((member) => !selectedIds.has(member.id))
      .filter(
        (member) =>
          !hasIncompatibleAttendance({
            attendances,
            attendanceDate,
            period,
            memberId: member.id,
          })
      )
      .filter((member) =>
        getMemberName(member).toLowerCase().includes(normalizedSearchText)
      )
      .slice(0, 8);
  }, [
    attendanceDate,
    attendances,
    members,
    normalizedSearchText,
    period,
    selectedMemberIds,
  ]);

  function addMember(memberId: string) {
    setSelectedMemberIds((currentIds) =>
      currentIds.includes(memberId) ? currentIds : [...currentIds, memberId]
    );
    setSearchText("");
  }

  function removeMember(memberId: string) {
    setSelectedMemberIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== memberId)
    );
  }

  async function saveAttendance() {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const result = await saveAttendanceAction({
      attendanceDate,
      period,
      memberIds: selectedMemberIds,
      comment,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(`${labels.saveError}: ${result.error}`);
      return;
    }

    setMessage(labels.saved);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <label className="block text-sm font-semibold text-app">
          {labels.date}
          <input
            type="date"
            value={attendanceDate}
            onChange={(event) => changeAttendanceDate(event.target.value)}
            className="input-app mt-1 h-11 px-3 py-2 text-base"
            disabled={isSubmitting}
          />
        </label>

        <label className="block text-sm font-semibold text-app">
          {labels.period}
          <select
            value={period}
            onChange={(event) =>
              changePeriod(event.target.value as AttendancePeriod)
            }
            className="input-app mt-1 h-11 px-3 py-2 text-base"
            disabled={isSubmitting}
          >
            <option value="morning">{labels.morning}</option>
            <option value="afternoon">{labels.afternoon}</option>
            <option value="full_day">{labels.fullDay}</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-semibold text-app">
        {labels.searchMember}
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="input-app mt-1 h-11 px-3 py-2 text-base"
          placeholder={labels.searchMemberPlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
        />
      </label>

      <label className="block text-sm font-semibold text-app">
        {labels.comment}
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="input-app mt-1 min-h-20 px-3 py-2 text-base"
          placeholder={labels.commentPlaceholder}
          disabled={isSubmitting}
        />
      </label>

      <div className="min-h-[4rem] rounded-lg border border-app-border bg-app-soft p-2">
        <div className="px-2 pb-2 text-xs leading-snug text-app-muted">
          {labels.incompatibleAttendanceHelp}
        </div>
        {!normalizedSearchText ? (
          <div className="px-2 py-3 text-sm text-app-muted">
            {labels.typeToSearchMembers}
          </div>
        ) : memberResults.length === 0 ? (
          <div className="px-2 py-3 text-sm text-app-muted">
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
                <span className="text-xs text-primary-app">{labels.add}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-app-border bg-app">
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
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="text-sm font-semibold text-app">
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveAttendance}
          className="btn-primary-app px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || !attendanceDate}
        >
          {isSubmitting ? labels.saving : labels.accept}
        </button>
      </div>
    </div>
  );
}
