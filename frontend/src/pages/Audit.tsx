import { useState } from "react";
import { useQuery } from "../hooks";
import type { Audit as AuditEvent, Page } from "../types";
import { PageHeading, dateLabel } from "../components/Primitives";
import { Input } from "../components/Fields";
import { Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
export default function Audit() {
  const [action, setAction] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useQuery<Page<AuditEvent>>(
    "/audit?limit=25&offset=" +
      offset +
      (action ? "&action=" + encodeURIComponent(action) : ""),
  );
  return (
    <>
      <PageHeading
        eyebrow="A CONSIDERED RECORD"
        title="The activity behind the workspace."
        description="Account and workflow events, with employee narratives kept out of the log."
      />
      <div className="filter-bar">
        <Input
          label="Filter by exact action"
          placeholder="For example, feedback.published"
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setOffset(0);
          }}
        />
      </div>
      <ErrorPanel error={query.error} retry={query.reload} />
      <section className="panel">
        {query.loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Metadata-only activity log</caption>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Actor identifier</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((row) => (
                  <tr key={row.id}>
                    <td>{dateLabel(row.created_at)}</td>
                    <td>
                      <code>{row.action}</code>
                    </td>
                    <td>
                      {row.resource_type}
                      <p>{row.resource_id || "Workspace"}</p>
                    </td>
                    <td>
                      <small>{row.actor_id || "System"}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>{query.data?.total ?? 0} events</span>
          <button
            className="button small"
            disabled={offset === 0}
            onClick={() => setOffset((value) => Math.max(0, value - 25))}
          >
            Previous
          </button>
          <button
            className="button small"
            disabled={!query.data || offset + 25 >= query.data.total}
            onClick={() => setOffset((value) => value + 25)}
          >
            Next
          </button>
        </div>
      </section>
    </>
  );
}
