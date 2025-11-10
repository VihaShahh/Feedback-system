import { useState } from "react";
import { Plus } from "lucide-react";
import { useQuery } from "../hooks";
import type { Page, Goal } from "../types";
import {
  PageHeading,
  Progress,
  Badge,
  dateLabel,
} from "../components/Primitives";
import { Loading, Empty } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
import { GoalCreate } from "../features/GoalCreate";
import { GoalEditor } from "../features/GoalEditor";
export default function Goals() {
  const query = useQuery<Page<Goal>>("/goals?limit=100");
  const [create, setCreate] = useState(false);
  const [editing, setEditing] = useState<Goal>();
  return (
    <>
      <PageHeading
        eyebrow="SMALL STEPS, MEANINGFUL GROWTH"
        title="A little closer to what’s next."
        description="Turn a thoughtful conversation into a step you can take."
        action={
          <button className="button primary" onClick={() => setCreate(true)}>
            <Plus size={16} />
            Add a goal
          </button>
        }
      />
      <ErrorPanel error={query.error} retry={query.reload} />
      {query.loading ? (
        <Loading />
      ) : query.data?.items.length ? (
        <div className="grid-2">
          {query.data.items.map((goal) => (
            <article className="panel" key={goal.id}>
              <div className="row-between">
                <Badge value={goal.state} />
                <small className="muted">Due {dateLabel(goal.due_on)}</small>
              </div>
              <h2 className="section-spacing">{goal.title}</h2>
              <p className="detail-copy">{goal.description}</p>
              <Progress value={goal.progress} label={goal.title} />
              <div className="row-between">
                <small className="muted">
                  {goal.progress}% of the way there
                </small>
                {goal.state !== "cancelled" && (
                  <button
                    className="text-button"
                    onClick={() => setEditing(goal)}
                  >
                    Update progress
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        !query.error && (
          <div className="panel">
            <Empty
              title="Growth begins with one small step"
              description="Choose something you care about, and make a little room for it."
              action={
                <button className="button" onClick={() => setCreate(true)}>
                  Create your first goal
                </button>
              }
            />
          </div>
        )
      )}
      {create && (
        <GoalCreate close={() => setCreate(false)} saved={query.reload} />
      )}{" "}
      {editing && (
        <GoalEditor
          goal={editing}
          close={() => setEditing(undefined)}
          saved={query.reload}
        />
      )}
    </>
  );
}
