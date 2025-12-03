import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useQuery } from "../hooks";
import type { Person, Feedback, Page } from "../types";
import { PageHeading } from "../components/Primitives";
import { FeedbackCard } from "../components/FeedbackCard";
import { Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
import { TeamGoals } from "../features/TeamGoals";
import { TeamCheckIns } from "../features/TeamCheckIns";
export default function Employee() {
  const { employeeId } = useParams();
  const person = useQuery<Person>("/people/" + employeeId);
  const feedback = useQuery<Page<Feedback>>(
    "/feedback?employee_id=" + employeeId + "&limit=100",
  );
  const [tab, setTab] = useState("feedback");
  if (person.loading) return <Loading />;
  if (!person.data)
    return <ErrorPanel error={person.error} retry={person.reload} />;
  return (
    <>
      <Link className="section-link" to="/people">
        <ArrowLeft size={14} />
        My team
      </Link>
      <PageHeading
        eyebrow={person.data.department}
        title={`${person.data.name.split(" ")[0]}’s growth, in perspective.`}
        description={
          person.data.title || "A little context for your next one-to-one."
        }
        action={
          <Link
            className="button primary"
            to={"/feedback/new?employee_id=" + employeeId}
          >
            <Plus size={15} />
            Write feedback
          </Link>
        }
      />
      <div className="tabs" aria-label="Employee growth sections">
        {[
          ["feedback", "Feedback"],
          ["goals", "Development goals"],
          ["checkins", "Weekly check-ins"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={"tab " + (tab === value ? "active" : "")}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "feedback" && (
        <div className="content-width">
          <ErrorPanel error={feedback.error} retry={feedback.reload} />
          {feedback.loading ? (
            <Loading />
          ) : (
            feedback.data?.items.map((row) => (
              <FeedbackCard key={row.id} feedback={row} />
            ))
          )}
          {feedback.data?.total === 0 && (
            <p className="muted">
              No feedback has been shared in this view yet.
            </p>
          )}
        </div>
      )}
      {tab === "goals" && <TeamGoals employeeId={employeeId!} />}{" "}
      {tab === "checkins" && <TeamCheckIns employeeId={employeeId!} />}
    </>
  );
}
