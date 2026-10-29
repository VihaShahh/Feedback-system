import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Archive } from "lucide-react";
import type { Feedback } from "../types";
import { api, json } from "../api";
import { useAction } from "../hooks";
import { Dialog } from "../components/Dialog";
import { ErrorPanel } from "../components/ErrorPanel";
export function FeedbackActions({
  feedback,
  reload,
}: {
  feedback: Feedback;
  reload: () => void;
}) {
  const [action, setAction] = useState<"publish" | "archive">();
  const request = useAction();
  const navigate = useNavigate();
  return (
    <>
      {feedback.capabilities.publish && (
        <button className="button primary" onClick={() => setAction("publish")}>
          <Send size={15} />
          Publish feedback
        </button>
      )}
      {feedback.capabilities.archive && (
        <button className="button" onClick={() => setAction("archive")}>
          <Archive size={15} />
          Archive
        </button>
      )}
      {action && (
        <Dialog
          title={
            action === "publish"
              ? "Ready to share this conversation?"
              : "Archive this feedback?"
          }
          close={() => setAction(undefined)}
        >
          <p className="dialog-copy">
            {action === "publish"
              ? `Publishing shares this feedback with ${feedback.employee_name}. They can reflect, reply, and acknowledge it.`
              : "The conversation and its history will remain available in the archived view. Further edits and replies will be closed."}
          </p>
          <ErrorPanel error={request.error} />
          <div className="form-actions">
            <button className="button" onClick={() => setAction(undefined)}>
              Keep reviewing
            </button>
            <button
              className="button primary"
              disabled={request.busy}
              onClick={() =>
                void request.run(
                  () =>
                    api("/feedback/" + feedback.id + "/" + action, {
                      method: "POST",
                      body: json({ version: feedback.version }),
                    }),
                  () => {
                    setAction(undefined);
                    action === "archive"
                      ? navigate("/feedback?state=archived")
                      : reload();
                  },
                )
              }
            >
              {request.busy
                ? "Saving…"
                : action === "publish"
                  ? "Publish now"
                  : "Archive feedback"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
