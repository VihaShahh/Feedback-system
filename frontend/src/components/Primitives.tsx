import type { ReactNode } from "react";
import type { Sentiment } from "../types";
export const sentimentLabel: Record<Sentiment, string> = {
  positive: "Positive",
  balanced: "Balanced",
  needs_attention: "Needs attention",
};
export function Badge({ value }: { value: string | null }) {
  if (!value) return <span className="badge neutral">Not yet reviewed</span>;
  return (
    <span className={"badge " + value}>
      {sentimentLabel[value as Sentiment] || value.replaceAll("_", " ")}
    </span>
  );
}
export function Avatar({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  return (
    <span className={"avatar " + (small ? "small" : "")} aria-hidden="true">
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function dateLabel(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? value + "T12:00:00" : value);
  return Number.isNaN(date.valueOf())
    ? "—"
    : new Intl.DateTimeFormat(
        "en",
        options || { month: "short", day: "numeric", year: "numeric" },
      ).format(date);
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </div>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
