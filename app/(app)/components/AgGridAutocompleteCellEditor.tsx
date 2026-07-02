"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type AgGridAutocompleteCellEditorProps = {
  value?: string | null;
  options?: string[];
  onValueChange?: (value: string) => void;
  stopEditing?: (cancel?: boolean) => void;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getBestOption(value: string, options: string[]) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "";
  }

  const exactOption = options.find(
    (option) => normalizeText(option) === normalizedValue
  );

  if (exactOption) {
    return exactOption;
  }

  const filteredOptions = options.filter((option) =>
    normalizeText(option).includes(normalizedValue)
  );

  if (filteredOptions.length === 1) {
    return filteredOptions[0];
  }

  return value.trim();
}

export default function AgGridAutocompleteCellEditor({
  value,
  options = [],
  onValueChange,
  stopEditing,
}: AgGridAutocompleteCellEditorProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();

  const initialValue = String(value ?? "");

  const [inputValue, setInputValue] = useState(initialValue);

  const filteredOptions = useMemo(() => {
    const search = normalizeText(inputValue);

    if (!search) {
      return options.slice(0, 50);
    }

    return options
      .filter((option) => normalizeText(option).includes(search))
      .slice(0, 50);
  }, [inputValue, options]);

  useEffect(() => {
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, []);

  function updateValue(nextValue: string) {
    setInputValue(nextValue);
    onValueChange?.(nextValue);
  }

  function commitValue() {
    const committedValue = getBestOption(inputValue, options);

    updateValue(committedValue);

    window.setTimeout(() => {
      stopEditing?.();
    }, 0);
  }

  return (
    <div className="h-full w-full">
      <input
        ref={inputRef}
        type="text"
        list={listId}
        className="h-full w-full border-0 bg-transparent px-2 text-sm outline-none"
        value={inputValue}
        autoComplete="off"
        onChange={(event) => updateValue(event.target.value)}
        onBlur={commitValue}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitValue();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            updateValue(initialValue);
            stopEditing?.(true);
          }
        }}
      />

      <datalist id={listId}>
        {filteredOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}