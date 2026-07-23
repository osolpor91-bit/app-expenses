"use client";

import { useEffect, useState, useTransition } from "react";

import {
  findPublicWorkGroupMembersAction,
  getPublicWorkGroupsForMemberAction,
  searchPublicWorkGroupMembersAction,
  type PublicWorkGroupLookupResult,
} from "./actions";

type PublicWorkGroupsLookupProps = {
  initialMessage: string;
};

const emptyResult: PublicWorkGroupLookupResult = {
  ok: true,
  message: null,
  members: [],
  selectedMember: null,
};

export default function PublicWorkGroupsLookup({
  initialMessage,
}: PublicWorkGroupsLookupProps) {
  const [query, setQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [result, setResult] =
    useState<PublicWorkGroupLookupResult>(emptyResult);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      return;
    }

    let isCancelled = false;

    const timeoutId = window.setTimeout(() => {
      startTransition(async () => {
        const nextResult =
          await findPublicWorkGroupMembersAction(normalizedQuery);
        if (!isCancelled) {
          setResult(nextResult);
          setSelectedMemberId(
            nextResult.members.length === 1 ? nextResult.members[0].memberId : ""
          );
        }
      });
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedMemberId("");
    setResult((currentResult) =>
      value.trim().length < 2
        ? {
            ok: true,
            message: null,
            members: [],
            selectedMember: null,
          }
        : {
            ...currentResult,
            selectedMember: null,
          }
    );
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedMemberId) {
      handleSelectMember(selectedMemberId);
      return;
    }

    startTransition(async () => {
      const nextResult = await searchPublicWorkGroupMembersAction(query);
      setResult(nextResult);
      setSelectedMemberId(
        nextResult.members.length === 1 ? nextResult.members[0].memberId : ""
      );
    });
  }

  function handleSelectMember(memberId: string) {
    startTransition(async () => {
      const nextResult = await getPublicWorkGroupsForMemberAction(memberId);
      setResult(nextResult);
    });
  }

  const selectedMember = result.selectedMember;
  const showMemberSelect = !selectedMember && result.members.length > 0;

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="space-y-2">
        <div>
          <label
            htmlFor="member-search"
            className="text-xs font-semibold text-primary-app"
          >
            Nombre y apellidos
          </label>
          <input
            id="member-search"
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Ej. Carlos Fraile"
            className="input-app mt-1 px-3 py-2 text-sm"
            autoComplete="name"
          />
        </div>

        {showMemberSelect && (
          <div>
            <label
              htmlFor="member-select"
              className="text-xs font-semibold text-primary-app"
            >
              Selecciona tu nombre
            </label>
            <select
              id="member-select"
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              className="input-app mt-1 px-3 py-2 text-sm"
            >
              <option value="">Elige una persona</option>
              {result.members.map((member) => (
                <option key={member.memberId} value={member.memberId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || (showMemberSelect && !selectedMemberId)}
          className="btn-primary-app w-full px-4 py-2 text-sm disabled:opacity-60"
        >
          {isPending ? "Buscando..." : "Ver grupos"}
        </button>
      </form>

      {result.message ? (
        <div
          className={
            result.ok
              ? "rounded-lg border border-app bg-app-soft px-3 py-2 text-xs text-app-muted"
              : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          }
        >
          {result.message}
        </div>
      ) : !selectedMember ? (
        <div className="rounded-lg border border-app bg-app-soft px-3 py-2 text-xs text-app-muted">
          {initialMessage}
        </div>
      ) : null}

      {selectedMember && (
        <section className="space-y-3">
          <div className="rounded-lg border border-[#cabe9d] bg-[#f2f0e7] px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a2e2e]">
              {selectedMember.companyName}
            </p>
            <h2 className="mt-1 text-xl font-black leading-tight text-primary-app">
              {selectedMember.memberName}
            </h2>
            <p className="mt-1 text-xs font-semibold text-app-muted">
              {selectedMember.groupCount}{" "}
              {selectedMember.groupCount === 1
                ? "grupo asignado"
                : "grupos asignados"}
            </p>
          </div>

          {selectedMember.groups.length === 0 ? (
            <div className="rounded-lg border border-app bg-white px-3 py-3 text-sm text-app-muted">
              Has trabajado de recital y este año no tienes ningún grupo.
              Enhorabuena.
            </div>
          ) : (
            <div className="grid gap-2">
              {selectedMember.groups.map((group) => (
                <article
                  key={group.groupId}
                  className="rounded-lg border border-app bg-white p-3 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase leading-tight text-primary-app">
                        {group.title}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-app-muted">
                        {group.dayLabel} · {group.periodLabel} ·{" "}
                        {group.timeLabel}
                      </p>
                    </div>

                    {group.isLead && (
                      <span className="badge-app w-fit px-2.5 py-1 text-[11px] font-bold">
                        Encargado
                      </span>
                    )}
                  </div>

                  <div className="mt-3 border-t border-app pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-app-muted">
                      Compañeros
                    </p>

                    {group.companions.length === 0 ? (
                      <p className="mt-1 text-xs text-app-muted">
                        Sin compañeros asignados.
                      </p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {group.companions.map((companion) => (
                          <span
                            key={`${group.groupId}-${companion.name}`}
                            className={
                              companion.isLead
                                ? "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"
                                : "badge-app px-2.5 py-1 text-xs font-semibold"
                            }
                          >
                            {companion.name}
                            {companion.isLead ? " · Encargado" : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
