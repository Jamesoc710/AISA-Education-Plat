"use client";

import { useRef } from "react";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Search icon */}
      <span
        style={{
          position: "absolute",
          left: "9px",
          color: "var(--color-text-3)",
          pointerEvents: "none",
          display: "flex",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>

      <input
        ref={inputRef}
        type="text"
        placeholder="Search concepts…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "220px",
          height: "30px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "6px",
          padding: "0 28px 0 30px",
          fontSize: "13px",
          color: "var(--color-text)",
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.1s, width 0.15s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-accent)";
          e.currentTarget.style.width = "280px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.width = "220px";
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          style={{
            position: "absolute",
            right: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "18px",
            height: "18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--color-text-3)",
            padding: 0,
            borderRadius: "3px",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
