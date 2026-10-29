import { useState } from "react";
import type { Revision } from "../types";
import { useQuery } from "../hooks";
import { Badge, dateLabel } from "../components/Primitives";
import { Select } from "../components/Fields";
import { Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
export function RevisionHistory({ id }: { id: string }) {
  const query = useQuery<{ items: Revision[] }>(
    "/feedback/" + id + "/revisions",
  );
  const [version, setVersion] = useState("");
  if (query.loading) return <Loading label="Loading revision history…" />;
  if (!query.data)
    return <ErrorPanel error={query.error} retry={query.reload} />;
  const selected =
    query.data.items.find((row) => String(row.version) === version) ||
    query.data.items[0];
  const previous = query.data.items.find(
    (row) => row.version < (selected?.version || 0),
  );
  return (
    <section className="panel section-spacing">
      <h2>Published revision history</h2>
      <p className="muted tiny">
        Each published version remains available for context.
      </p>
      {selected ? (
        <>
          <Select
            label="Published version"
            value={String(selected.version)}
            onChange={(event) => setVersion(event.target.value)}
          >
            {query.data.items.map((row) => (
              <option key={row.version} value={row.version}>
                Version {row.version} · {dateLabel(row.created_at)}
              </option>
            ))}
          </Select>
          <div className="grid-2">
            {[previous, selected].map((row, index) =>
              row ? (
                <div className="revision" key={row.id}>
                  <h3>
                    {index ? "Selected version" : "Previous published version"}{" "}
                    · {row.version}
                  </h3>
                  <Badge value={row.sentiment} />
                  <h3 className="section-spacing">Strengths</h3>
                  <p>{row.strengths}</p>
                  <h3>Areas to develop</h3>
                  <p>{row.improvements}</p>
                </div>
              ) : (
                <p className="muted tiny" key="none">
                  This is the first published version.
                </p>
              ),
            )}
          </div>
        </>
      ) : (
        <p className="muted tiny">Drafts do not have published revisions.</p>
      )}
    </section>
  );
}
