"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

/**
 * Slim rounded search input — the one Linear pattern we kept.
 * - Press `/` anywhere on the page to focus
 * - Press `Esc` while focused to clear and blur
 * - Shows a subtle `/` keyboard hint on the right when not focused
 */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search concepts…",
  width = 320,
  focusedWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number;
  focusedWidth?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // Global "/" to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const editable = (e.target as HTMLElement | null)?.isContentEditable;
      if (editable) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const expanded = focused && focusedWidth ? focusedWidth : width;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: `${expanded}px`,
        transition: "width 160ms ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 12,
          color: focused ? "var(--color-text-2)" : "var(--color-text-3)",
          pointerEvents: "none",
          display: "flex",
          transition: "color 120ms ease",
        }}
      >
        <Icon name="search" size={15} strokeWidth={2} />
      </span>

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (value) onChange("");
            else (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        style={{
          width: "100%",
          height: 36,
          backgroundColor: "var(--color-surface)",
          border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
          boxShadow: focused
            ? "0 0 0 3px var(--color-accent-dim)"
            : "var(--shadow-card)",
          borderRadius: 10,
          padding: "0 36px 0 36px",
          fontSize: 13.5,
          color: "var(--color-text)",
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 120ms ease, box-shadow 120ms ease",
        }}
      />

      {/* Right-side affordance: `/` kbd hint when empty+unfocused, clear button otherwise */}
      {value ? (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--color-text-3)",
            padding: 0,
            borderRadius: 4,
          }}
        >
          <Icon name="x" size={13} strokeWidth={2.25} />
        </button>
      ) : (
        !focused && (
          <kbd
            aria-hidden
            style={{
              position: "absolute",
              right: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              fontSize: 11,
              lineHeight: 1,
              fontFamily: "inherit",
              color: "var(--color-text-3)",
              backgroundColor: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 5,
              pointerEvents: "none",
            }}
          >
            /
          </kbd>
        )
      )}
    </div>
  );
}
