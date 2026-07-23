"use server";

import {
  getPublicWorkGroupsForMember,
  searchPublicWorkGroupMembers,
  type PublicWorkGroupMemberGroups,
  type PublicWorkGroupMemberOption,
} from "@/lib/workGroups/publicWorkGroupLookup";

export type PublicWorkGroupLookupResult = {
  ok: boolean;
  message: string | null;
  members: PublicWorkGroupMemberOption[];
  selectedMember: PublicWorkGroupMemberGroups | null;
};

function createErrorResult(message: string): PublicWorkGroupLookupResult {
  return {
    ok: false,
    message,
    members: [],
    selectedMember: null,
  };
}

export async function searchPublicWorkGroupMembersAction(
  query: string
): Promise<PublicWorkGroupLookupResult> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return createErrorResult("Escribe al menos 2 letras del nombre.");
  }

  try {
    const members = await searchPublicWorkGroupMembers(normalizedQuery);

    if (members.length === 0) {
      return {
        ok: true,
        message: "No he encontrado ningún miembro con ese nombre.",
        members: [],
        selectedMember: null,
      };
    }

    if (members.length === 1) {
      const selectedMember = await getPublicWorkGroupsForMember(
        members[0].memberId
      );

      return {
        ok: true,
        message: null,
        members,
        selectedMember,
      };
    }

    return {
      ok: true,
      message: "He encontrado varias personas. Elige cuál eres.",
      members,
      selectedMember: null,
    };
  } catch (error) {
    return createErrorResult(
      error instanceof Error
        ? error.message
        : "No se pudo consultar el informe de grupos."
    );
  }
}

export async function findPublicWorkGroupMembersAction(
  query: string
): Promise<PublicWorkGroupLookupResult> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return {
      ok: true,
      message: null,
      members: [],
      selectedMember: null,
    };
  }

  try {
    const members = await searchPublicWorkGroupMembers(normalizedQuery);

    return {
      ok: true,
      message:
        members.length === 0
          ? "No he encontrado ningún miembro con ese nombre."
          : null,
      members,
      selectedMember: null,
    };
  } catch (error) {
    return createErrorResult(
      error instanceof Error
        ? error.message
        : "No se pudieron buscar miembros."
    );
  }
}

export async function getPublicWorkGroupsForMemberAction(
  memberId: string
): Promise<PublicWorkGroupLookupResult> {
  if (!memberId.trim()) {
    return createErrorResult("Selecciona un miembro.");
  }

  try {
    const selectedMember = await getPublicWorkGroupsForMember(memberId);

    if (!selectedMember) {
      return {
        ok: true,
        message: "No he encontrado ese miembro.",
        members: [],
        selectedMember: null,
      };
    }

    return {
      ok: true,
      message: null,
      members: [
        {
          memberId: selectedMember.memberId,
          name: selectedMember.memberName,
        },
      ],
      selectedMember,
    };
  } catch (error) {
    return createErrorResult(
      error instanceof Error
        ? error.message
        : "No se pudo cargar el informe de grupos."
    );
  }
}
