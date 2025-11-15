import { useState } from "react";
import { Heart } from "lucide-react";
import { api, json } from "../api";
import { useAction, useQuery } from "../hooks";
import type { CheckIn, Page } from "../types";
import { PageHeading, Badge, dateLabel } from "../components/Primitives";
import { Input, Select, Textarea } from "../components/Fields";
import { Loading, Success } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
function currentMonday() {
  const today = new Date();
  today.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
export default function CheckIns() {
  const query = useQuery<Page<CheckIn>>("/checkins?limit=100");
  const action = useAction();
  const [week, setWeek] = useState(currentMonday);
  const [mood, setMood] = useState<CheckIn["mood"]>("okay");
  const [workload, setWorkload] = useState<CheckIn["workload"]>("balanced");
  const [note, setNote] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="A MOMENT TO PAUSE"
        title="How are you, really?"
        description="Check in with yourself and give your manager a little context."
      />
      <div className="dashboard-grid">
        <div className="panel">
          <h2>A small reflection on your week</h2>
          <p className="muted tiny">Visible to you and your current manager.</p>
          <form
            className="section-spacing"
            onSubmit={(event) => {
              event.preventDefault();
              void action.run(
                () =>
                  api("/checkins", {
                    method: "POST",
                    body: json({ week_of: week, mood, workload, note }),
                  }),
                () => {
                  setNote("");
                  query.reload();
                },
                "Your check-in is saved. Thank you for sharing.",
              );
            }}
          >
            <Input
              label="Week beginning (Monday)"
              type="date"
              required
              value={week}
              onChange={(event) => setWeek(event.target.value)}
            />
            <p className="tiny">How has your week felt?</p>
            <div className="checkin-mood">
              {(
                [
                  ["great", "☀", "Feeling good"],
                  ["okay", "⛅", "Doing okay"],
                  ["struggling", "☁", "Need support"],
                ] as const
              ).map(([value, emoji, label]) => (
                <button
                  className={
                    "mood-button " + (mood === value ? "selected" : "")
                  }
                  aria-pressed={mood === value}
                  type="button"
                  key={value}
                  onClick={() => setMood(value)}
                >
                  <span aria-hidden="true">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
            <Select
              label="Your workload"
              value={workload}
              onChange={(event) =>
                setWorkload(event.target.value as CheckIn["workload"])
              }
            >
              <option value="light">A little room to breathe</option>
              <option value="balanced">In a good balance</option>
              <option value="heavy">More than I can comfortably carry</option>
            </Select>
            <Textarea
              label="Anything on your mind?"
              hint="Optional. Share a win, a challenge, or where support would help."
              value={note}
              maxLength={2000}
              onChange={(event) => setNote(event.target.value)}
            />
            <ErrorPanel error={action.error} />
            <Success message={action.success} />
            <button className="button primary" disabled={action.busy}>
              <Heart size={15} />
              {action.busy ? "Saving…" : "Share check-in"}
            </button>
          </form>
        </div>
        <section className="panel">
          <h2>Your recent reflections</h2>
          <ErrorPanel error={query.error} retry={query.reload} />
          {query.loading ? (
            <Loading />
          ) : (
            query.data?.items.map((row) => (
              <article className="detail-section" key={row.id}>
                <div className="row-between">
                  <strong className="tiny">
                    Week of {dateLabel(row.week_of)}
                  </strong>
                  <Badge value={row.mood} />
                </div>
                <p className="checkin-note">
                  {row.note || "A little moment to check in."}
                </p>
                <span className="muted tiny">Workload: {row.workload}</span>
                {row.response && (
                  <div className="response-box section-spacing">
                    <strong>Your manager’s response</strong>
                    <p className="checkin-note">{row.response}</p>
                  </div>
                )}
              </article>
            ))
          )}
          {query.data?.total === 0 && (
            <p className="muted tiny section-spacing">
              Your weekly reflections will appear here.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
