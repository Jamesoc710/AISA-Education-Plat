"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

type MCQuestionProps = {
  question: {
    id: string;
    questionText: string;
    options: { text: string; isCorrect: boolean }[];
    answerExplanation: string;
  };
  onAnswer: (correct: boolean, selectedIndex: number) => void;
};

export function MCQuestion({ question, onAnswer }: MCQuestionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const answered = selectedIndex !== null;

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
    onAnswer(question.options[index].isCorrect, index);
  };

  return (
    <div>
      {/* Question text */}
      <h2
        style={{
          margin: "0 0 22px",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--color-text)",
          lineHeight: 1.45,
          letterSpacing: "-0.015em",
        }}
      >
        {question.questionText}
      </h2>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {question.options.map((opt, i) => (
          <MCOption
            key={i}
            index={i}
            text={opt.text}
            isCorrect={opt.isCorrect}
            answered={answered}
            isSelected={selectedIndex === i}
            onSelect={() => handleSelect(i)}
          />
        ))}
      </div>

      {/* Explanation — shown after answering */}
      {answered && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 22,
            padding: "16px 18px 18px",
            backgroundColor: "var(--color-accent-soft)",
            borderRadius: "var(--radius-2)",
            borderLeft: "3px solid var(--color-accent)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-accent-on-soft)",
              marginBottom: "var(--space-2)",
            }}
          >
            <Icon name="info" size={12} strokeWidth={2.25} />
            Explanation
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-base)",
              color: "var(--color-text)",
              lineHeight: 1.65,
            }}
          >
            {question.answerExplanation}
          </p>
        </div>
      )}
    </div>
  );
}

function MCOption({
  index,
  text,
  isCorrect,
  answered,
  isSelected,
  onSelect,
}: {
  index: number;
  text: string;
  isCorrect: boolean;
  answered: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hov, setHov] = useState(false);

  let borderColor = "var(--color-border)";
  let bgColor = "var(--color-surface)";
  let textColor = "var(--color-text)";
  let indicatorBg = "transparent";
  let indicatorBorder = "var(--color-border)";
  let indicatorColor = "var(--color-text-3)";
  let boxShadow = "var(--shadow-card)";

  if (answered) {
    if (isCorrect) {
      borderColor = "var(--color-correct-border)";
      bgColor = "var(--color-correct-dim)";
      indicatorBg = "var(--color-correct)";
      indicatorBorder = "var(--color-correct)";
      indicatorColor = "#fff";
      boxShadow = "none";
    } else if (isSelected) {
      borderColor = "var(--color-incorrect-border)";
      bgColor = "var(--color-incorrect-dim)";
      textColor = "var(--color-text-2)";
      indicatorBg = "var(--color-incorrect)";
      indicatorBorder = "var(--color-incorrect)";
      indicatorColor = "#fff";
      boxShadow = "none";
    } else {
      textColor = "var(--color-text-3)";
      borderColor = "var(--color-border-subtle)";
      bgColor = "var(--color-surface)";
      boxShadow = "none";
    }
  } else if (hov) {
    borderColor = "var(--color-accent)";
    bgColor = "var(--color-accent-soft)";
    indicatorBorder = "var(--color-accent)";
    indicatorColor = "var(--color-accent-on-soft)";
    boxShadow = "var(--shadow-card-hover)";
  }

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={answered}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "14px 16px",
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius-2)",
        cursor: answered ? "default" : "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        boxShadow,
        transition:
          "border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease",
        width: "100%",
      }}
    >
      {/* Letter / status indicator */}
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `1.5px solid ${indicatorBorder}`,
          backgroundColor: indicatorBg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "var(--text-xs)",
          fontWeight: 650,
          color: indicatorColor,
          transition: "all 180ms ease",
        }}
      >
        {answered && isCorrect
          ? "✓"
          : answered && isSelected && !isCorrect
            ? "✗"
            : String.fromCharCode(65 + index)}
      </span>

      {/* Option text */}
      <span
        style={{
          fontSize: "var(--text-base)",
          color: textColor,
          lineHeight: 1.5,
          fontWeight: 500,
          transition: "color 180ms ease",
          flex: 1,
        }}
      >
        {text}
      </span>
    </button>
  );
}
