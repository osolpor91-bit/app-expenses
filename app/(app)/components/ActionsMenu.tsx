"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ActionsMenuProps = {
  label?: string;
  emptyLabel?: string;
  children?: ReactNode;
};

export default function ActionsMenu({
  label = "Actions",
  emptyLabel = "No actions available",
  children,
}: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasChildren = Boolean(children);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="btn-secondary-app px-3 py-1.5 text-center text-xs"
      >
        {label} <span aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-20 mt-2 min-w-64 rounded-xl border border-app bg-app p-2 shadow-lg">
          <div className="flex flex-col gap-1">
            {hasChildren ? (
              children
            ) : (
              <div className="rounded-lg px-3 py-2 text-sm text-app-muted">
                {emptyLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}