import { useState } from "react";
import { api, json } from "../api";
import { useAction, useQuery } from "../hooks";
import type { CheckIn, Page } from "../types";
import { Badge, dateLabel } from "../components/Primitives";
import { Textarea } from "../components/Fields";
import { Empty, Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
function ResponseForm({ row, reload }: { row: CheckIn; reload: () => void }) {
  const [response, setResponse] = useState("");
  const action = useAction();
  return (
    <form
      className="section-spacing"
      onSubmit={(event) => {
        event.preventDefault();
        void action.run(
          () =>
            api("/checkins/" + row.id + "/response", {
              method: "POST",
              body: json({ response }),
            }),
          reload,
        );
      }}
    >
      <Textarea
        label="A supportive response"
        value={response}
        minLength={3}
        maxLength={2000}
        required
        onChange={(event) => setResponse(event.target.value)}
      />
      <ErrorPanel error={action.error} />
      <button className="button small" disabled={action.busy}>
        Share response
      </button>
    </form>
  );
}
export function TeamCheckIns({ employeeId }: { employeeId: string }) {
  const query = useQuery<Page<CheckIn>>(
    "/checkins?limit=100&employee_id=" + employeeId,
  );
  return (
    <section className="panel">
      <h2>A little context for your next conversation</h2>
      <ErrorPanel error={query.error} retry={query.reload} />
      {query.loading ? (
        <Loading />
      ) : (
        query.data?.items.map((row) => (
          <article className="detail-section" key={row.id}>
            <div className="row-between">
              <strong className="tiny">Week of {dateLabel(row.week_of)}</strong>
              <Badge value={row.mood} />
            </div>
            <p className="tiny muted">Workload: {row.workload}</p>
            <p className="detail-copy">{row.note}</p>
            {row.response ? (
              <div className="response-box">
                <strong>Manager response</strong>
                <p className="checkin-note">{row.response}</p>
              </div>
            ) : (
              <ResponseForm row={row} reload={query.reload} />
            )}
          </article>
        ))
      )}
      {query.data?.total === 0 && (
        <Empty
          title="No reflections shared yet"
          description="Weekly check-ins will appear here when your direct report shares one."
        />
      )}
    </section>
  );
}
