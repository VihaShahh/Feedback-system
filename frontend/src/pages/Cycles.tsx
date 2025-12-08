import { useState } from "react";
import { Plus } from "lucide-react";
import { api, json } from "../api";
import { useAction, useQuery } from "../hooks";
import type { Cycle } from "../types";
import { PageHeading, Badge, dateLabel } from "../components/Primitives";
import { Input } from "../components/Fields";
import { Dialog } from "../components/Dialog";
import { Loading, Empty } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
export default function Cycles() {
  const query = useQuery<{ items: Cycle[] }>("/cycles");
  const action = useAction();
  const [create, setCreate] = useState(false);
  const [transition, setTransition] = useState<Cycle>();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE STRUCTURE FOR GROWTH"
        title="Make time for the conversation."
        description="Create review cycles and give your team a shared moment to reflect."
        action={
          <button
            className="button primary"
            onClick={() => {
              action.clear();
              setCreate(true);
            }}
          >
            <Plus size={15} />
            New review cycle
          </button>
        }
      />
      <ErrorPanel error={query.error} retry={query.reload} />
      {query.loading ? (
        <Loading />
      ) : (
        <div className="grid-2">
          {query.data?.items.map((row) => (
            <article className="panel" key={row.id}>
              <div className="row-between">
                <h2>{row.name}</h2>
                <Badge value={row.state} />
              </div>
              <p className="tiny muted">
                {dateLabel(row.starts_on)} – {dateLabel(row.ends_on)}
              </p>
              <p className="tiny muted">
                {row.state === "open"
                  ? "Available for feedback during these dates."
                  : row.state === "closed"
                    ? "History remains available. New publication is closed."
                    : "Draft cycles are ready for an administrator to open."}
              </p>
              {row.state !== "closed" && (
                <button
                  className="button small"
                  onClick={() => {
                    action.clear();
                    setTransition(row);
                  }}
                >
                  {row.state === "draft" ? "Open cycle" : "Close cycle"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      {query.data?.items.length === 0 && (
        <Empty
          title="A fresh space for growth"
          description="Create a review cycle when your team is ready for a shared reflection."
        />
      )}
      {create && (
        <Dialog title="Plan a review cycle" close={() => setCreate(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action.run(
                () =>
                  api("/cycles", {
                    method: "POST",
                    body: json({ name, starts_on: start, ends_on: end }),
                  }),
                () => {
                  setCreate(false);
                  setName("");
                  query.reload();
                },
              );
            }}
          >
            <Input
              label="Cycle name"
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              label="Start date"
              required
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
            <Input
              label="End date"
              required
              type="date"
              min={start}
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
            <ErrorPanel error={action.error} />
            <div className="form-actions">
              <button
                type="button"
                className="button"
                onClick={() => setCreate(false)}
              >
                Cancel
              </button>
              <button className="button primary" disabled={action.busy}>
                Create cycle
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {transition && (
        <Dialog
          title={
            transition.state === "draft"
              ? "Open this review cycle?"
              : "Close this review cycle?"
          }
          close={() => setTransition(undefined)}
        >
          <p className="dialog-copy">
            {transition.state === "draft"
              ? "The cycle becomes available for feedback during its dates. Open cycles cannot overlap."
              : "Existing history stays available. Drafts in this cycle cannot be published after closing. This transition cannot be reversed."}
          </p>
          <ErrorPanel error={action.error} />
          <div className="form-actions">
            <button className="button" onClick={() => setTransition(undefined)}>
              Keep reviewing
            </button>
            <button
              className="button primary"
              disabled={action.busy}
              onClick={() =>
                void action.run(
                  () =>
                    api("/cycles/" + transition.id, {
                      method: "PATCH",
                      body: json({
                        state: transition.state === "draft" ? "open" : "closed",
                      }),
                    }),
                  () => {
                    setTransition(undefined);
                    query.reload();
                  },
                )
              }
            >
              Confirm {transition.state === "draft" ? "open" : "close"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
