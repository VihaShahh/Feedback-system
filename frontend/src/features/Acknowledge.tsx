import { CheckCheck } from "lucide-react";
import type { Feedback } from "../types";
import { api, json } from "../api";
import { useAction } from "../hooks";
import { ErrorPanel } from "../components/ErrorPanel";
export function Acknowledge({
  feedback,
  reload,
}: {
  feedback: Feedback;
  reload: () => void;
}) {
  const action = useAction();
  if (!feedback.capabilities.acknowledge)
    return feedback.acknowledged_at ? (
      <span className="ack-tag">
        <CheckCheck size={15} />
        Acknowledged
      </span>
    ) : null;
  return (
    <div>
      <button
        className="button primary"
        disabled={action.busy}
        onClick={() =>
          void action.run(
            () =>
              api("/feedback/" + feedback.id + "/acknowledge", {
                method: "POST",
                body: json({ version: feedback.version }),
              }),
            reload,
          )
        }
      >
        <CheckCheck size={16} />
        {action.busy ? "Saving…" : "Acknowledge feedback"}
      </button>
      <ErrorPanel error={action.error} retry={reload} />
    </div>
  );
}
