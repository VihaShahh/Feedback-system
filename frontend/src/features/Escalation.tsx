import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { Feedback } from "../types";
import { api, json } from "../api";
import { useAction } from "../hooks";
import { Dialog } from "../components/Dialog";
import { Textarea } from "../components/Fields";
import { ErrorPanel } from "../components/ErrorPanel";
export function Escalation({
  feedback,
  reload,
}: {
  feedback: Feedback;
  reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const action = useAction();
  return (
    <>
      {feedback.escalated && (
        <section className="panel section-spacing">
          <h2>
            <ShieldCheck size={17} /> A little extra support
          </h2>
          <p className="detail-copy">{feedback.escalation_note}</p>
          {feedback.resolution_note && (
            <div className="response-box">
              <strong>Senior management’s response</strong>
              <p className="checkin-note">{feedback.resolution_note}</p>
            </div>
          )}
          {feedback.capabilities.resolve && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void action.run(
                  () =>
                    api("/feedback/" + feedback.id + "/resolve", {
                      method: "POST",
                      body: json({ note }),
                    }),
                  reload,
                );
              }}
            >
              <Textarea
                label="Resolution and agreed next steps"
                required
                minLength={5}
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <ErrorPanel error={action.error} />
              <button className="button primary" disabled={action.busy}>
                Resolve escalation
              </button>
            </form>
          )}
        </section>
      )}
      {feedback.capabilities.escalate && (
        <div className="section-spacing">
          <button className="text-button" onClick={() => setOpen(true)}>
            <ShieldCheck size={15} />
            Ask senior management for support
          </button>
        </div>
      )}
      {open && (
        <Dialog
          title="Bring in a wider perspective?"
          close={() => setOpen(false)}
        >
          <p className="dialog-copy">
            This shares the published feedback and your note with senior
            management. Use it when a conversation would benefit from additional
            support.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action.run(
                () =>
                  api("/feedback/" + feedback.id + "/escalate", {
                    method: "POST",
                    body: json({ version: feedback.version, note }),
                  }),
                () => {
                  setOpen(false);
                  reload();
                },
              );
            }}
          >
            <Textarea
              label="How could senior management help?"
              required
              minLength={5}
              maxLength={2000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <ErrorPanel error={action.error} />
            <div className="form-actions">
              <button
                type="button"
                className="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className="button primary" disabled={action.busy}>
                Share for support
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
