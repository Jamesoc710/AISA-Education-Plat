"use client";

import { useState } from "react";

type MCQuestionProps = {
  question: {
    id: string;
    questionText: string;
    options: { text: string; isCorrect: boolean }[];
    answerExplanation: string;
  };
  onAnswer: (correct: boolean) => void;
};

export function MCQuestion({ question, onAnswer }: MCQuestionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const answered = selectedIndex !== null;

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
    onAnswer(question.options[index].isCorrect);
  };

  return (
    <div>
      {/* Question text */}
      <h2
        style={{
          margin: "0 0 24px",
          fontSize: "18px",
          fontWeight: 500,
          color: "var(--color-text)",
          lineHeight: "1.5",
          letterSpacing: "-0.01em",
        }}
      >
        {question.questionText}
      </h2>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {question.options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = opt.isCorrect;

          let borderColor = "var(--color-border)";
          let bgColor = "var(--color-surface)";
          let textColor = "var(--color-text)";
          let indicatorBg = "transparent";
          let indicatorBorder = "var(--color-border)";

          if (answered) {
            if (isCorrectOption) {
              borderColor = "var(--color-correct-border)";
              bgColor = "var(--color-correct-dim)";
              indicatorBg = "var(--color-correct)";
              indicatorBorder = "var(--color-correct)";
            } else if (isSelected && !isCorrectOption) {
              borderColor = "var(--color-incorrect-border)";
              bgColor = "var(--color-incorrect-dim)";
              textColor = "var(--color-text-2)";
              indicatorBg = "var(--color-incorrect)";
              indicatorBorder = "var(--color-incorrect)";
            } else {
              textColor = "var(--color-text-3)";
              borderColor = "var(--color-border-subtle)";
              bgColor = "var(--color-bg)";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "8px",
                cursor: answered ? "default" : "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition:
                  "border-color 0.2s ease, background-color 0.2s ease",
                width: "100%",
              }}
            >
              {/* Letter indicator */}
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: `2px solid ${indicatorBorder}`,
                  backgroundColor: indicatorBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "11px",
                  fontWeight: 600,
                  color:
                    answered && (isCorrectOption || isSelected)
                      ? "#fff"
                      : "var(--color-text-3)",
                  transition: "all 0.2s ease",
                  marginTop: "1px",
                }}
              >
                {answered && isCorrectOption
                  ? "✓"
                  : answered && isSelected && !isCorrectOption
                    ? "✗"
                    : String.fromCharCode(65 + i)}
              </span>

              {/* Option text */}
              <span
                style={{
                  fontSize: "14px",
                  color: textColor,
                  lineHeight: "1.5",
                  transition: "color 0.2s ease",
                }}
              >
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation — shown after answering */}
      {answered && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "20px",
            padding: "16px 18px",
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-3)",
              marginBottom: "8px",
            }}
          >
            Explanation
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--color-text-2)",
              lineHeight: "1.65",
            }}
          >
            {question.answerExplanation}
          </p>
        </div>
      )}
    </div>
  );
}
