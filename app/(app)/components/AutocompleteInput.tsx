"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type KeyboardEventHandler,
} from "react";

type AutocompleteOption = {
  value: string;
  label: string;
  menuLabel?: string;
  searchLabel?: string;
};

type AutocompleteInputProps = {
  value: string;
  options: AutocompleteOption[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  menuPlacement?: "bottom" | "top" | "auto";
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | "type"
    | "className"
    | "value"
    | "placeholder"
    | "disabled"
    | "required"
    | "autoComplete"
    | "onFocus"
    | "onChange"
    | "onBlur"
    | "onKeyDown"
  > &
  Record<`data-${string}`, string | number | undefined> & {
    onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  };
  onValueChange: (value: string) => void;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getVerticalScrollBoundary(element: HTMLElement) {
  let parent = element.parentElement;

  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);

    if (
      style.overflowY === "auto" ||
      style.overflowY === "scroll" ||
      style.overflowY === "hidden"
    ) {
      const rect = parent.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
      };
    }

    parent = parent.parentElement;
  }

  return {
    top: 0,
    bottom: window.innerHeight,
  };
}

export default function AutocompleteInput({
  value,
  options,
  className = "",
  placeholder,
  disabled = false,
  required = false,
  menuPlacement = "auto",
  inputProps,
  onValueChange,
}: AutocompleteInputProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value) ?? null;
  }, [options, value]);

  const [inputValue, setInputValue] = useState(selectedOption?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [resolvedMenuPlacement, setResolvedMenuPlacement] = useState<
    "bottom" | "top"
  >("bottom");

  const filteredOptions = useMemo(() => {
    const search = normalizeText(inputValue);

    if (!search) {
      return options.slice(0, 50);
    }

    return options
      .filter((option) =>
        normalizeText(
          option.searchLabel ?? option.menuLabel ?? option.label
        ).includes(search)
      )
      .slice(0, 50);
  }, [inputValue, options]);

  useEffect(() => {
    setInputValue(selectedOption?.label ?? "");
  }, [selectedOption?.label]);

  useEffect(() => {
    if (menuPlacement !== "auto") {
      setResolvedMenuPlacement(menuPlacement);
      return;
    }

    if (!isOpen || filteredOptions.length === 0 || !wrapperRef.current) {
      return;
    }

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const boundary = getVerticalScrollBoundary(wrapperRef.current);

    const availableBelow = boundary.bottom - wrapperRect.bottom;
    const availableAbove = wrapperRect.top - boundary.top;
    const estimatedMenuHeight = Math.min(filteredOptions.length * 38, 256) + 8;

    if (availableBelow < estimatedMenuHeight && availableAbove > availableBelow) {
      setResolvedMenuPlacement("top");
      return;
    }

    setResolvedMenuPlacement("bottom");
  }, [filteredOptions.length, isOpen, menuPlacement]);

  function commitOption(option: AutocompleteOption) {
    setInputValue(option.label);
    setIsOpen(false);
    setHighlightedIndex(0);
    onValueChange(option.value);
  }

  function clearValue() {
    setInputValue("");
    setIsOpen(false);
    setHighlightedIndex(0);
    onValueChange("");
  }

  function commitTypedValueOrReset() {
    const typedText = normalizeText(inputValue);

    if (!typedText) {
      clearValue();
      return;
    }

    const exactOption = options.find(
      (option) => normalizeText(option.label) === typedText
    );

    if (exactOption) {
      commitOption(exactOption);
      return;
    }

    setInputValue(selectedOption?.label ?? "");
    setIsOpen(false);
    setHighlightedIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        Math.min(currentIndex + 1, filteredOptions.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      if (isOpen && filteredOptions[highlightedIndex]) {
        event.preventDefault();
        commitOption(filteredOptions[highlightedIndex]);
      }

      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setInputValue(selectedOption?.label ?? "");
      return;
    }

    inputProps?.onKeyDown?.(event);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        {...inputProps}
        type="text"
        className={className}
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setInputValue(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            commitTypedValueOrReset();
          }, 120);
        }}
        onKeyDown={handleKeyDown}
      />

      {isOpen && filteredOptions.length > 0 && !disabled && (
        <div
          className={[
            "absolute z-[80] max-h-64 min-w-[20rem] max-w-[34rem] overflow-auto rounded-xl border-2 border-[var(--color-primary)] bg-white shadow-2xl ring-4 ring-slate-900/10",
            resolvedMenuPlacement === "top"
              ? "bottom-full mb-2"
              : "top-full mt-2",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {filteredOptions.map((option, index) => (
            <button
              key={option.value}
              type="button"
              className={[
                "block w-full whitespace-nowrap border-b border-app px-3 py-2.5 text-left text-sm last:border-b-0",
                index === highlightedIndex
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-app hover:bg-app-soft hover:text-primary-app",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={(event) => {
                event.preventDefault();
                commitOption(option);
              }}
            >
              {option.menuLabel ?? option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}