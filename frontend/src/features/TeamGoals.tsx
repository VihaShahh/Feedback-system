import { useState } from "react";
import { Plus } from "lucide-react";
import { useQuery } from "../hooks";
import type { Page, Goal } from "../types";
import { GoalCreate } from "./GoalCreate";
import { GoalEditor } from "./GoalEditor";
import { Badge, Progress, dateLabel } from "../components/Primitives";
import { Loading, Empty } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
export function TeamGoals({ employeeId }: { employeeId: string }) {
  const query = useQuery<Page<Goal>>(
    "/goals?limit=100&employee_id=" + employeeId,
  );
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<Goal>();
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Development goals</h2>
        <button className="button small" onClick={() => setCreate(true)}>
          <Plus size={14} />
          Assign a goal
        </button>
      </div>
      <ErrorPanel error={query.error} retry={query.reload} />
      {query.loading ? (
        <Loading />
      ) : (
        query.data?.items.map((row) => (
          <div className="goal-card" key={row.id}>
            <div className="row-between">
              <h3>{row.title}</h3>
              <Badge value={row.state} />
            </div>
            <p className="tiny muted">{row.description}</p>
            <Progress value={row.progress} label={row.title} />
            <div className="row-between">
              <span>
                Due {dateLabel(row.due_on)} · {row.progress}%
              </span>
              {row.state !== "cancelled" && (
                <button className="text-button" onClick={() => setEdit(row)}>
                  Update goal
                </button>
              )}
            </div>
          </div>
        ))
      )}
      {query.data?.total === 0 && (
        <Empty
          title="Choose the next step together"
          description="Add a shared goal to give your next conversation a little direction."
        />
      )}
      {create && (
        <GoalCreate
          employeeId={employeeId}
          close={() => setCreate(false)}
          saved={query.reload}
        />
      )}{" "}
      {edit && (
        <GoalEditor
          goal={edit}
          close={() => setEdit(undefined)}
          saved={query.reload}
        />
      )}
    </section>
  );
}
