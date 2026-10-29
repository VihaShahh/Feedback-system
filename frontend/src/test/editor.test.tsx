import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { validateFeedback } from "../features/feedbackValidation";
import { ConflictPanel } from "../features/ConflictPanel";
import type { Feedback } from "../types";
const latest: Feedback = {
  id: "feedback",
  employee_id: "employee",
  employee_name: "Alex Morgan",
  author_id: "manager",
  author_name: "Maya Chen",
  cycle_id: null,
  strengths: "A newer strengths assessment",
  improvements: "A newer development step",
  sentiment: "balanced",
  state: "published",
  version: 3,
  created_at: "2026-10-01T12:00:00Z",
  updated_at: "2026-10-02T12:00:00Z",
  published_at: "2026-10-01T12:00:00Z",
  acknowledged_at: null,
  acknowledged_version: null,
  escalated: false,
  escalation_note: null,
  resolution_note: null,
  resolved_at: null,
  capabilities: {
    edit: true,
    publish: false,
    archive: true,
    acknowledge: false,
    comment: true,
    escalate: true,
    resolve: false,
  },
};
describe("feedback editor guardrails", () => {
  it("requires a recipient and constructive bounded content", () => {
    expect(
      validateFeedback({
        employee_id: "",
        strengths: " ",
        improvements: "x".repeat(4001),
        sentiment: "positive",
      }),
    ).toMatchObject({
      employee_id: expect.any(String),
      strengths: expect.any(String),
      improvements: expect.any(String),
    });
  });
  it("accepts a complete draft without demanding a review cycle", () => {
    expect(
      validateFeedback({
        employee_id: "employee",
        strengths: "Good collaboration",
        improvements: "Share decisions earlier",
        sentiment: "balanced",
      }),
    ).toEqual({});
  });
  it("requires an explicit choice before resolving a version conflict", () => {
    const useLatest = vi.fn();
    const keepLocal = vi.fn();
    render(
      <ConflictPanel
        latest={latest}
        useLatest={useLatest}
        keepLocal={keepLocal}
      />,
    );
    expect(
      screen.getByText("A newer strengths assessment"),
    ).toBeInTheDocument();
    expect(useLatest).not.toHaveBeenCalled();
    expect(keepLocal).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Keep my edits for review" }),
    );
    expect(keepLocal).toHaveBeenCalledOnce();
    expect(useLatest).not.toHaveBeenCalled();
  });
});
