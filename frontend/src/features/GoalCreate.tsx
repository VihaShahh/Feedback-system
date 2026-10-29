import { useState } from "react";
import { api, json } from "../api";
import { useAction } from "../hooks";
import { Dialog } from "../components/Dialog";
import { Input, Textarea } from "../components/Fields";
import { ErrorPanel } from "../components/ErrorPanel";
export function GoalCreate({
  employeeId,
  close,
  saved,
}: {
  employeeId?: string;
  close: () => void;
  saved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const action = useAction();
  return (
    <Dialog title="Give your next step a name" close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(
            () =>
              api("/goals", {
                method: "POST",
                body: json({
                  title,
                  description,
                  due_on: due || null,
                  ...(employeeId ? { employee_id: employeeId } : {}),
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
          required
          minLength={3}
          maxLength={160}
          placeholder="What would you like to work toward?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          label="Why it matters"
          maxLength={4000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Input
          label="Target date"
          type="date"
          value={due}
          onChange={(event) => setDue(event.target.value)}
        />
        <ErrorPanel error={action.error} />
        <div className="form-actions">
          <button className="button" type="button" onClick={close}>
            Cancel
          </button>
          <button className="button primary" disabled={action.busy}>
            Create goal
          </button>
        </div>
      </form>
    </Dialog>
  );
}
