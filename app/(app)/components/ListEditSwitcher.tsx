"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type ListEditSwitcherProps = {
  editButtonLabel?: string;
  viewButtonLabel?: string;
  loadingLabel?: string;
  viewActions?: ReactNode;
  viewContent: ReactNode;
  renderEditContent: (props: { backButton: ReactNode }) => ReactNode;
  onBeforeOpenEdit?: () => Promise<void> | void;
  onBeforeBackToView?: () => Promise<void> | void;
};

const buttonClassName =
  "btn-primary-app px-3 py-1.5 text-center text-xs disabled:cursor-not-allowed disabled:opacity-60";

export default function ListEditSwitcher({
  editButtonLabel = "Edit list",
  viewButtonLabel = "View list",
  loadingLabel = "Loading...",
  viewActions,
  viewContent,
  renderEditContent,
  onBeforeOpenEdit,
  onBeforeBackToView,
}: ListEditSwitcherProps) {
  const [editMode, setEditMode] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);

  async function openEditMode() {
    setIsChangingMode(true);

    try {
      await onBeforeOpenEdit?.();
      setEditMode(true);
    } finally {
      setIsChangingMode(false);
    }
  }

  async function backToViewMode() {
    setIsChangingMode(true);

    try {
      await onBeforeBackToView?.();
      setEditMode(false);
    } finally {
      setIsChangingMode(false);
    }
  }

  const backButton = (
    <button
      type="button"
      onClick={backToViewMode}
      disabled={isChangingMode}
      className={buttonClassName}
    >
      {isChangingMode ? loadingLabel : viewButtonLabel}
    </button>
  );

  if (editMode) {
    return <>{renderEditContent({ backButton })}</>;
  }

  return (
    <>
      <div className="sticky top-[168px] z-[80] -mx-4 bg-app px-4 pb-1 pt-0 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openEditMode}
            disabled={isChangingMode}
            className={buttonClassName}
          >
            {isChangingMode ? loadingLabel : editButtonLabel}
          </button>

          {viewActions}
        </div>
      </div>

      {viewContent}
    </>
  );
}