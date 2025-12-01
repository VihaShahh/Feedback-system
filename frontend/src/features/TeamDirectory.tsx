import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "../hooks";
import type { Person, Page } from "../types";
import { Avatar } from "../components/Primitives";
import { Input } from "../components/Fields";
import { Empty, Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
export function TeamDirectory() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useQuery<Page<Person>>(
    "/people?team_only=true&limit=15&offset=" +
      offset +
      "&q=" +
      encodeURIComponent(search),
  );
  return (
    <>
      <div className="filter-bar">
        <Input
          label="Find someone on your team"
          placeholder="Search by name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOffset(0);
          }}
        />
        <Search size={19} />
      </div>
      <ErrorPanel error={query.error} retry={query.reload} />
      {query.loading ? (
        <Loading />
      ) : (
        <div className="team-cards">
          {query.data?.items.map((person) => (
            <article className="panel team-card" key={person.id}>
              <div className="person-line">
                <Avatar name={person.name} />
                <div>
                  <strong>{person.name}</strong>
                  <small>{person.title || person.department}</small>
                </div>
              </div>
              <p className="tiny muted">{person.department}</p>
              <Link className="button small" to={"/people/" + person.id}>
                View growth profile
              </Link>
              <Link
                className="section-link section-spacing"
                to={"/feedback/new?employee_id=" + person.id}
              >
                Write feedback
              </Link>
            </article>
          ))}
        </div>
      )}
      {query.data?.total === 0 && (
        <Empty
          title="No teammates in this view"
          description="Try another name, or ask your administrator to check reporting relationships."
        />
      )}
      <div className="pagination">
        <span>{query.data?.total ?? 0} direct reports</span>
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
    </>
  );
}
