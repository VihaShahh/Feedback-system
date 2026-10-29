import { useState } from "react";
import { Plus, Pencil, ShieldCheck } from "lucide-react";
import { useSession } from "../session";
import { useQuery } from "../hooks";
import type { Person, Page } from "../types";
import { Avatar, Badge } from "../components/Primitives";
import { Input } from "../components/Fields";
import { Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
import { PersonCreate } from "./PersonCreate";
import { PersonEdit } from "./PersonEdit";
import { Grants } from "./Grants";
export function AdminPeople() {
  const { session } = useSession();
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useQuery<Page<Person>>(
    "/people?limit=15&offset=" + offset + "&q=" + encodeURIComponent(search),
  );
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<Person>();
  const [grants, setGrants] = useState<Person>();
  return (
    <>
      <div className="filter-bar">
        <Input
          label="Search people"
          placeholder="Find someone by name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOffset(0);
          }}
        />
        <button className="button primary" onClick={() => setCreate(true)}>
          <Plus size={15} />
          Add person
        </button>
      </div>
      <ErrorPanel error={query.error} retry={query.reload} />
      <div className="panel">
        {query.loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table>
              <caption className="sr-only">
                Workspace accounts and permissions
              </caption>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="person-line">
                        <Avatar name={person.name} small />
                        <div>
                          <strong>{person.name}</strong>
                          <small>{person.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge value={person.role} />
                    </td>
                    <td>{person.department}</td>
                    <td>{person.active ? "Active" : "Disabled"}</td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={"Edit " + person.name}
                        onClick={() => setEdit(person)}
                      >
                        <Pencil size={15} />
                      </button>
                      {session?.capabilities.grants_manage && (
                        <button
                          className="icon-button"
                          aria-label={"Privileges for " + person.name}
                          onClick={() => setGrants(person)}
                        >
                          <ShieldCheck size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>{query.data?.total ?? 0} accounts</span>
          <button
            className="button small"
            disabled={offset === 0}
            onClick={() => setOffset((value) => Math.max(0, value - 15))}
          >
            Previous
          </button>
          <button
            className="button small"
            disabled={!query.data || offset + 15 >= query.data.total}
            onClick={() => setOffset((value) => value + 15)}
          >
            Next
          </button>
        </div>
      </div>
      {create && (
        <PersonCreate close={() => setCreate(false)} saved={query.reload} />
      )}{" "}
      {edit && (
        <PersonEdit
          person={edit}
          close={() => setEdit(undefined)}
          saved={query.reload}
        />
      )}{" "}
      {grants && <Grants person={grants} close={() => setGrants(undefined)} />}
    </>
  );
}
