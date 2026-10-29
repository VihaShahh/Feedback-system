import { useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { api, json } from "../api";
import { useQuery, useAction } from "../hooks";
import { useSession } from "../session";
import type { FeedbackRequest, Page } from "../types";
import { PageHeading, Badge, dateLabel } from "../components/Primitives";
import { Input, Textarea } from "../components/Fields";
import { Empty, Loading, Success } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
import { FulfilRequest } from "../features/FulfilRequest";
export default function Requests() {
  const { session } = useSession();
  const [offset, setOffset] = useState(0);
  const query = useQuery<Page<FeedbackRequest>>(
    "/requests?limit=20&offset=" + offset,
  );
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const action = useAction();
  return (
    <>
      <PageHeading
        eyebrow="MAKE ROOM FOR A CONVERSATION"
        title="A fresh perspective starts with asking."
        description="Let your manager know what you would like feedback on."
      />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Your feedback requests</h2>
          </div>
          <ErrorPanel error={query.error} retry={query.reload} />
          {query.loading ? (
            <Loading />
          ) : (
            query.data?.items.map((row) => (
              <article className="detail-section" key={row.id}>
                <div className="row-between">
                  <h3>{row.topic}</h3>
                  <Badge value={row.state} />
                </div>
                <p className="tiny muted">
                  {row.employee_name} · {dateLabel(row.created_at)}
                </p>
                <p className="detail-copy">{row.note}</p>
                {row.feedback_id && (
                  <Link
                    className="section-link"
                    to={"/feedback/" + row.feedback_id}
                  >
                    Read the feedback
                  </Link>
                )}
                {row.state === "open" &&
                  row.employee_id === session?.user.id && (
                    <button
                      className="text-button"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(
                          () =>
                            api("/requests/" + row.id + "/cancel", {
                              method: "POST",
                            }),
                          query.reload,
                        )
                      }
                    >
                      Cancel request
                    </button>
                  )}
                {row.state === "open" &&
                  session?.capabilities.team &&
                  row.employee_id !== session.user.id && (
                    <>
                      <Link
                        className="section-link"
                        to={"/feedback/new?employee_id=" + row.employee_id}
                      >
                        Write feedback for {row.employee_name.split(" ")[0]}
                      </Link>
                      <FulfilRequest request={row} saved={query.reload} />
                    </>
                  )}
              </article>
            ))
          )}
          {query.data?.total === 0 && (
            <Empty
              title="No open conversations here yet"
              description="Ask for a perspective on something that matters to you."
            />
          )}
          <div className="pagination">
            <button
              className="button small"
              disabled={offset === 0}
              onClick={() => setOffset((value) => Math.max(0, value - 20))}
            >
              Previous
            </button>
            <button
              className="button small"
              disabled={!query.data || offset + 20 >= query.data.total}
              onClick={() => setOffset((value) => value + 20)}
            >
              Next
            </button>
          </div>
        </section>
        <section className="panel">
          <h2>What would you like a perspective on?</h2>
          <p className="muted tiny">
            Your request goes to your current manager.
          </p>
          <form
            className="section-spacing"
            onSubmit={(event) => {
              event.preventDefault();
              void action.run(
                () =>
                  api("/requests", {
                    method: "POST",
                    body: json({ topic, note }),
                  }),
                () => {
                  setTopic("");
                  setNote("");
                  setOffset(0);
                  query.reload();
                },
                "Request sent. Your next conversation is on its way.",
              );
            }}
          >
            <Input
              label="Topic"
              required
              minLength={3}
              maxLength={160}
              value={topic}
              placeholder="A project, a milestone, a skill…"
              onChange={(event) => setTopic(event.target.value)}
            />
            <Textarea
              label="A little context"
              value={note}
              maxLength={2000}
              onChange={(event) => setNote(event.target.value)}
            />
            <ErrorPanel error={action.error} />
            <Success message={action.success} />
            <button className="button primary" disabled={action.busy}>
              <Send size={15} />
              Request feedback
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
