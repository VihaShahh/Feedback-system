import { useState } from "react";
import { api, json } from "../api";
import { useAction, useQuery } from "../hooks";
import type { Comment } from "../types";
import { Avatar, dateLabel } from "../components/Primitives";
import { Textarea } from "../components/Fields";
import { ErrorPanel } from "../components/ErrorPanel";
export function Conversation({
  id,
  writable,
}: {
  id: string;
  writable: boolean;
}) {
  const query = useQuery<{ items: Comment[] }>("/feedback/" + id + "/comments");
  const [body, setBody] = useState("");
  const action = useAction();
  return (
    <section className="panel section-spacing">
      <h2>Keep the conversation going</h2>
      <p className="muted tiny">
        Share a reflection, ask a question, or agree on a next step.
      </p>
      <ErrorPanel error={query.error} retry={query.reload} />
      {query.data?.items.map((row) => (
        <div className="comment" key={row.id}>
          <Avatar name={row.author_name} small />
          <div>
            <strong>{row.author_name}</strong>
            <small>{dateLabel(row.created_at)}</small>
            <p>{row.body}</p>
          </div>
        </div>
      ))}
      {query.data?.items.length === 0 && (
        <p className="muted tiny">
          No replies yet. A thoughtful question is a good place to start.
        </p>
      )}
      {writable && (
        <form
          className="section-spacing"
          onSubmit={(event) => {
            event.preventDefault();
            void action.run(
              () =>
                api("/feedback/" + id + "/comments", {
                  method: "POST",
                  body: json({ body }),
                }),
              () => {
                setBody("");
                query.reload();
              },
            );
          }}
        >
          <Textarea
            label="Your reflection"
            maxLength={2000}
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <ErrorPanel error={action.error} />
          <button className="button" disabled={action.busy || !body.trim()}>
            {action.busy ? "Posting…" : "Add reply"}
          </button>
        </form>
      )}
    </section>
  );
}
