import { useState } from "react";
import { api, json } from "../api";
import { useAction, useQuery } from "../hooks";
import { useSession } from "../session";
import type { Person, Page } from "../types";
import { Dialog } from "../components/Dialog";
import { Input, Select } from "../components/Fields";
import { ErrorPanel } from "../components/ErrorPanel";
export function PersonEdit({
  person,
  close,
  saved,
}: {
  person: Person;
  close: () => void;
  saved: () => void;
}) {
  const { session } = useSession();
  const [name, setName] = useState(person.name);
  const [department, setDepartment] = useState(person.department);
  const [title, setTitle] = useState(person.title);
  const [role, setRole] = useState(person.role);
  const [manager, setManager] = useState(person.manager_id || "");
  const [active, setActive] = useState(person.active);
  const [search, setSearch] = useState("");
  const managers = useQuery<Page<Person>>(
    "/people?limit=100&q=" + encodeURIComponent(search),
  );
  const action = useAction();
  return (
    <Dialog title={"Edit " + person.name} close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(
            () =>
              api("/people/" + person.id, {
                method: "PATCH",
                body: json({
                  name,
                  department,
                  title,
                  manager_id: manager || null,
                  active,
                  ...(session?.user.role === "admin" ? { role } : {}),
                }),
              }),
            () => {
              saved();
              close();
              if (person.id === session?.user.id)
                window.dispatchEvent(new Event("session-expired"));
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
        {session?.user.role === "admin" && (
          <Select
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value as Person["role"])}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="senior_management">Senior management</option>
            <option value="admin">Administrator</option>
          </Select>
        )}
        <Input
          label="Find a manager"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Reporting manager"
          value={manager}
          onChange={(event) => setManager(event.target.value)}
        >
          <option value="">No manager assigned</option>
          {person.manager_id &&
            !managers.data?.items.some(
              (row) => row.id === person.manager_id,
            ) && (
              <option value={person.manager_id}>Keep current manager</option>
            )}
          {managers.data?.items
            .filter(
              (row) =>
                row.role === "manager" && row.active && row.id !== person.id,
            )
            .map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
        </Select>
        <Select
          label="Account status"
          value={active ? "active" : "disabled"}
          onChange={(event) => setActive(event.target.value === "active")}
        >
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </Select>
        <p className="muted tiny">
          Changes to roles, status or reporting relationships revoke this
          person’s sessions.
        </p>
        <ErrorPanel error={managers.error} retry={managers.reload} />
        <ErrorPanel error={action.error} />
        <div className="form-actions">
          <button className="button" type="button" onClick={close}>
            Cancel
          </button>
          <button className="button primary" disabled={action.busy}>
            Save account
          </button>
        </div>
      </form>
    </Dialog>
  );
}
