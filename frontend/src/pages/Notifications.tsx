import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { api } from "../api";
import { useQuery, useAction } from "../hooks";
import type { Notification, Page } from "../types";
import { PageHeading, dateLabel } from "../components/Primitives";
import { Empty, Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
function destination(row: Notification) {
  if (row.kind === "feedback.requested" || row.kind.startsWith("request."))
    return "/requests";
  if (row.kind.startsWith("goal.")) return "/goals";
  if (row.kind.startsWith("checkin.")) return "/checkins";
  return row.resource_id ? "/feedback/" + row.resource_id : "/my-growth";
}
export default function Notifications() {
  const [offset, setOffset] = useState(0);
  const query = useQuery<Page<Notification> & { unread: number }>(
    "/notifications?limit=20&offset=" + offset,
  );
  const action = useAction();
  return (
    <div className="content-width">
      <PageHeading
        eyebrow="YOUR WORKSPACE, IN THE LOOP"
        title="A little update for you."
        description="New conversations, next steps, and moments worth a look."
      />
      <section className="panel">
        <div className="panel-heading">
          <h2>Your notifications</h2>
          <span className="badge positive">
            {query.data?.unread ?? 0} unread
          </span>
        </div>
        <ErrorPanel error={query.error} retry={query.reload} />
        <ErrorPanel error={action.error} />
        {query.loading ? (
          <Loading />
        ) : (
          query.data?.items.map((row) => (
            <article
              className={"notification " + (!row.read_at ? "unread" : "")}
              key={row.id}
            >
              <span className="avatar small">
                <Bell size={15} />
              </span>
              <div className="notification-body">
                <strong>{row.message}</strong>
                <p>
                  <Link to={destination(row)}>Take a look</Link>
                </p>
                <div className="row-between">
                  <span>{dateLabel(row.created_at)}</span>
                  {row.read_at ? (
                    <span>Read</span>
                  ) : (
                    <button
                      className="text-button"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(
                          () =>
                            api("/notifications/" + row.id + "/read", {
                              method: "POST",
                            }),
                          query.reload,
                        )
                      }
                    >
                      <CheckCheck size={13} />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
        {query.data?.total === 0 && (
          <Empty
            title="You’re all caught up"
            description="Your next workspace update will appear here."
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
    </div>
  );
}
