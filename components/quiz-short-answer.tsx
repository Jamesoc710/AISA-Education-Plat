"use client";

import { useState } from "react";

type ShortAnswerProps = {
  question: {
    id: string;
    questionText: string;
    answerExplanation: string;
  };
  onRevealed: () => void;
};

export function ShortAnswerQuestion({
  question,
  onRevealed,
}: ShortAnswerProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [selfAssessment, setSelfAssessment] = useState<
    "got-it" | "needs-review" | null
  >(null);

  const handleReveal = () => {
    setRevealed(true);
    onRevealed();
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

      {/* Text area for user's attempt */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--color-text-3)",
            marginBottom: "6px",
          }}
        >
          Your answer (optional)
        </label>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={revealed}
          placeholder="Type your answer here before revealing the model answer…"
          rows={4}
          style={{
            width: "100%",
            padding: "12px 14px",
            backgroundColor: revealed
              ? "var(--color-bg)"
              : "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            color: "var(--color-text)",
            fontSize: "13px",
            fontFamily: "inherit",
            lineHeight: "1.6",
            resize: "vertical",
            opacity: revealed ? 0.5 : 1,
            transition: "opacity 0.2s ease, background-color 0.2s ease",
          }}
        />
      </div>

      {/* Reveal button */}
      {!revealed && (
        <button
          onClick={handleReveal}
          style={{
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "inherit",
            color: "#fff",
            backgroundColor: "var(--color-accent)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
        >
          Reveal Answer
        </button>
      )}

      {/* Model answer */}
      {revealed && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "4px",
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
            Model Answer
          </div>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "13px",
              color: "var(--color-text-2)",
              lineHeight: "1.65",
            }}
          >
            {question.answerExplanation}
          </p>

          {/* Self-assessment */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              paddingTop: "12px",
              borderTop: "1px solid var(--color-border)",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "var(--color-text-3)",
                marginRight: "4px",
              }}
            >
              How'd you do?
            </span>
            <button
              onClick={() => setSelfAssessment("got-it")}
              style={{
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "inherit",
                color:
                  selfAssessment === "got-it" ? "#fff" : "var(--color-text-2)",
                backgroundColor:
                  selfAssessment === "got-it"
                    ? "var(--color-correct-dim)"
                    : "var(--color-surface)",
                border: `1px solid ${
                  selfAssessment === "got-it"
                    ? "var(--color-correct-border)"
                    : "var(--color-border)"
                }`,
                borderRadius: "5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Got it
            </button>
            <button
              onClick={() => setSelfAssessment("needs-review")}
              style={{
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "inherit",
                color:
                  selfAssessment === "needs-review"
                    ? "#fff"
                    : "var(--color-text-2)",
                backgroundColor:
                  selfAssessment === "needs-review"
                    ? "var(--color-gold-dim)"
                    : "var(--color-surface)",
                border: `1px solid ${
                  selfAssessment === "needs-review"
                    ? "rgba(232, 181, 74, 0.35)"
                    : "var(--color-border)"
                }`,
                borderRadius: "5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Needs review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
