import type { Sentiment } from "../types";
export interface FeedbackValues {
  strengths: string;
  improvements: string;
  sentiment: Sentiment;
  employee_id: string;
}
export function validateFeedback(values: FeedbackValues) {
  const errors: Record<string, string> = {};
  if (!values.employee_id) errors.employee_id = "Choose a direct report.";
  if (!values.strengths.trim() || values.strengths.length > 4000)
    errors.strengths = "Share strengths in 1–4,000 characters.";
  if (!values.improvements.trim() || values.improvements.length > 4000)
    errors.improvements = "Share areas to develop in 1–4,000 characters.";
  if (!["positive", "balanced", "needs_attention"].includes(values.sentiment))
    errors.sentiment = "Choose an overall sentiment.";
  return errors;
}
