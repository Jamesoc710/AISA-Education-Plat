import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type GradeResult = {
  score: "correct" | "partial" | "incorrect";
  reasoning: string;
};

/**
 * Grade a short-answer response using Claude Haiku.
 *
 * @param questionText  - The question that was asked
 * @param modelAnswer   - The correct/expected answer (answerExplanation)
 * @param studentAnswer - What the student wrote
 * @param conceptName   - Optional concept name for context
 */
export async function gradeShortAnswer({
  questionText,
  modelAnswer,
  studentAnswer,
  conceptName,
}: {
  questionText: string;
  modelAnswer: string;
  studentAnswer: string;
  conceptName?: string;
}): Promise<GradeResult> {
  if (!studentAnswer.trim()) {
    return {
      score: "incorrect",
      reasoning: "No answer was provided.",
    };
  }

  const prompt = `You are a fair, encouraging grader for an AI literacy education platform. Grade the student's answer to the following question.

QUESTION: ${questionText}
${conceptName ? `TOPIC: ${conceptName}` : ""}

MODEL ANSWER: ${modelAnswer}

STUDENT ANSWER: ${studentAnswer}

GRADING RUBRIC:
- "correct", The student demonstrates clear understanding of the core concept. Minor wording differences, extra detail, or slightly different phrasing are fine. They don't need to match the model answer word-for-word.
- "partial", The student shows some understanding but is missing key aspects, is vague, or has minor misconceptions. They're on the right track but incomplete.
- "incorrect", The student's answer is fundamentally wrong, shows no understanding of the concept, or is completely off-topic.

Respond in EXACTLY this JSON format (no other text):
{"score": "correct" | "partial" | "incorrect", "reasoning": "Brief 1-3 sentence explanation of why you gave this grade. Be specific about what they got right or wrong. Be encouraging but honest."}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text) as GradeResult;

    // Validate the score value
    if (!["correct", "partial", "incorrect"].includes(parsed.score)) {
      throw new Error(`Invalid score: ${parsed.score}`);
    }

    return parsed;
  } catch (err) {
    console.error("LLM grading error:", err);
    return {
      score: "partial",
      reasoning:
        "Automated grading encountered an issue. Your answer has been saved for manual review.",
    };
  }
}
