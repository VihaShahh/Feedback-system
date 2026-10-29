import type { Sentiment } from "../types";
import { sentimentLabel } from "./Primitives";
const colors: Record<Sentiment, string> = {
  positive: "#92a779",
  balanced: "#bac9d8",
  needs_attention: "#dec49a",
};
export function SentimentChart({
  counts,
}: {
  counts: Record<Sentiment, number>;
}) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const positive = total ? (counts.positive / total) * 100 : 0;
  const balanced = total ? (counts.balanced / total) * 100 : 0;
  return (
    <>
      <div className="sentiment-layout">
        <div
          className="donut"
          style={{
            background: total
              ? `conic-gradient(${colors.positive} 0 ${positive}%, ${colors.balanced} ${positive}% ${positive + balanced}%, ${colors.needs_attention} ${positive + balanced}% 100%)`
              : "#edf0e9",
          }}
          aria-hidden="true"
        >
          <div>
            <strong>{total}</strong>
            <small>conversations</small>
          </div>
        </div>
        <div className="legend">
          {(Object.keys(counts) as Sentiment[]).map((key) => (
            <div className="legend-row" key={key}>
              <span>
                <i className="legend-dot" style={{ background: colors[key] }} />
                {sentimentLabel[key]}
              </span>
              <strong>{counts[key]}</strong>
            </div>
          ))}
        </div>
      </div>
      <p className="chart-note">
        Every perspective is a starting point for growth.
      </p>
    </>
  );
}
export function ActivityChart({
  data,
}: {
  data: { month: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((row) => row.count));
  return (
    <>
      {data.length ? (
        <div
          className="bars"
          role="img"
          aria-label={data
            .map((row) => `${row.month}: ${row.count} conversations`)
            .join(", ")}
        >
          {data.map((row) => (
            <div className="bar-column" key={row.month}>
              <strong>{row.count}</strong>
              <i
                style={{ height: `${Math.max(4, (row.count / max) * 85)}%` }}
              />
              <small>
                {new Date(row.month + "-15").toLocaleDateString("en", {
                  month: "short",
                })}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted tiny">
          Your activity will appear after a feedback conversation is published.
        </p>
      )}
    </>
  );
}
