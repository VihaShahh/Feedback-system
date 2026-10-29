import { useState } from "react";
import { api, json } from "../api";
import { useAction } from "../hooks";
import type { Goal } from "../types";
import { Dialog } from "../components/Dialog";
import { Input, Select, Textarea } from "../components/Fields";
import { ErrorPanel } from "../components/ErrorPanel";
export function GoalEditor({
  goal,
  close,
  saved,
}: {
  goal: Goal;
  close: () => void;
  saved: () => void;
}) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [progress, setProgress] = useState(goal.progress);
  const [state, setState] = useState(goal.state);
  const action = useAction();
  return (
    <Dialog title="Your next step" close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(
            () =>
              api("/goals/" + goal.id, {
                method: "PATCH",
                body: json({
                  version: goal.version,
                  title,
                  description,
                  progress,
                  state,
                }),
              }),
            () => {
              saved();
              close();
            },
          );
        }}
      >
        <Input
          label="Goal"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          minLength={3}
          maxLength={160}
        />
        <Textarea
          label="Why it matters"
          value={description}
          maxLength={4000}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Input
          label="Progress (%)"
          type="number"
          min={0}
          max={100}
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
        />
        <Select
          label="Status"
          value={state}
          onChange={(event) => setState(event.target.value as Goal["state"])}
        >
          <option value="active">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <ErrorPanel error={action.error} />
        <div className="form-actions">
          <button className="button" type="button" onClick={close}>
            Cancel
          </button>
          <button className="button primary" disabled={action.busy}>
            {action.busy ? "Saving…" : "Save progress"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
