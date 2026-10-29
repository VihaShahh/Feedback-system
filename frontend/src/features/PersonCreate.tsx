import { useState } from "react";
import { api, json } from "../api";
import { useAction } from "../hooks";
import { useSession } from "../session";
import { Dialog } from "../components/Dialog";
import { Input, Select } from "../components/Fields";
import { ErrorPanel } from "../components/ErrorPanel";
export function PersonCreate({
  close,
  saved,
}: {
  close: () => void;
  saved: () => void;
}) {
  const { session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const action = useAction();
  return (
    <Dialog title="Welcome someone to the workspace" close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(
            () =>
              api("/people", {
                method: "POST",
                body: json({ name, email, password, role, department, title }),
              }),
            () => {
              saved();
              close();
            },
          );
        }}
      >
        <Input
          label="Full name"
          required
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Work email"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Initial password"
          hint="12–128 characters. Share it through your organization’s secure process."
          required
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Select
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="employee">Employee</option>
          {session?.user.role === "admin" && (
            <>
              <option value="manager">Manager</option>
              <option value="senior_management">Senior management</option>
              <option value="admin">Administrator</option>
            </>
          )}
        </Select>
        <Input
          label="Department"
          required
          maxLength={80}
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        />
        <Input
          label="Job title"
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <p className="muted tiny">
          Assign a reporting manager from the account’s Edit action after
          creation.
        </p>
        <ErrorPanel error={action.error} />
        <div className="form-actions">
          <button type="button" className="button" onClick={close}>
            Cancel
          </button>
          <button className="button primary" disabled={action.busy}>
            Create account
          </button>
        </div>
      </form>
    </Dialog>
  );
}
