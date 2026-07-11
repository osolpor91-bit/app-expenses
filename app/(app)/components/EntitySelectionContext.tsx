"use client";

import { createContext, useContext } from "react";

export type SelectedEntityRecord = {
  id: string;
  [key: string]: unknown;
};

const EntitySelectionContext = createContext<SelectedEntityRecord | null>(null);

export function EntitySelectionProvider({
  selectedRecord,
  children,
}: {
  selectedRecord: SelectedEntityRecord | null;
  children: React.ReactNode;
}) {
  return (
    <EntitySelectionContext.Provider value={selectedRecord}>
      {children}
    </EntitySelectionContext.Provider>
  );
}

export function useSelectedEntityRecord() {
  return useContext(EntitySelectionContext);
}
