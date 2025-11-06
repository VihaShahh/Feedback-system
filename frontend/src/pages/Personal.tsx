import { Link } from "react-router-dom";
import { ArrowUpRight, Sprout, Plus } from "lucide-react";
import { useSession } from "../session";
import { useQuery } from "../hooks";
import type { Dashboard, Goal, Page } from "../types";
import { PageHeading, Progress, dateLabel } from "../components/Primitives";
import { Stat } from "../components/Stats";
import { SentimentChart, ActivityChart } from "../components/Charts";
import { FeedbackCard } from "../components/FeedbackCard";
import { Loading, Empty } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
export default function Personal() {
  const { session } = useSession();
  const query = useQuery<Dashboard>("/dashboards/personal");
  const goals = useQuery<Page<Goal>>("/goals?limit=3");
  if (query.loading) return <Loading />;
  if (!query.data)
    return <ErrorPanel error={query.error} retry={query.reload} />;
  const data = query.data;
  return (
    <>
      <PageHeading
        eyebrow="YOUR GROWTH, ONE CONVERSATION AT A TIME"
        title={`Good to see you, ${session?.user.name.split(" ")[0]}.`}
        description="A little reflection today. A little more possibility tomorrow."
        action={
          <Link to="/requests" className="button">
            <Plus size={16} />
            Request feedback
          </Link>
        }
      />
      <div className="hero-card">
        <div>
          <h2>Progress starts with a conversation.</h2>
          <p>
            Take a moment to reflect on what’s going well, learn from a fresh
            perspective, and choose your next step.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Sprout size={48} strokeWidth={1.2} />
        </div>
      </div>
      <div className="stats">
        <Stat
          label="Feedback received"
          value={data.metrics.feedback_received}
          foot="Published conversations"
          icon="feedback"
        />
        <Stat
          label="To acknowledge"
          value={data.metrics.pending_acknowledgements}
          foot="Ready for your reflection"
          icon="pending"
        />
        <Stat
          label="Development goals"
          value={data.metrics.active_goals}
          foot="Small steps in progress"
          icon="goals"
        />
        <Stat
          label="Positive feedback"
          value={
            data.metrics.positive_percent === null
              ? "—"
              : data.metrics.positive_percent + "%"
          }
          foot="Celebrate what’s working"
          icon="positive"
        />
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent feedback</h2>
              <p>Thoughtful perspectives to help you move forward.</p>
            </div>
            <Link className="section-link" to="/feedback">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {data.recent_feedback.length ? (
            data.recent_feedback.map((row) => (
              <FeedbackCard key={row.id} feedback={row} />
            ))
          ) : (
            <Empty
              title="Your next conversation starts here"
              description="Ask your manager for feedback on a project or a recent milestone."
              action={
                <Link className="button" to="/requests">
                  Request feedback
                </Link>
              }
            />
          )}
        </div>
        <div className="stack">
          <section className="panel">
            <h2>Your feedback at a glance</h2>
            <p className="muted tiny">
              Different perspectives. One growing you.
            </p>
            <SentimentChart counts={data.sentiment} />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Small steps, real progress</h2>
              <Link className="section-link" to="/goals">
                View goals <ArrowUpRight size={14} />
              </Link>
            </div>
            <ErrorPanel error={goals.error} retry={goals.reload} />
            {goals.data?.items
              .filter((row) => row.state === "active")
              .map((goal) => (
                <div className="goal-card" key={goal.id}>
                  <h3>{goal.title}</h3>
                  <Progress value={goal.progress} label={goal.title} />
                  <div className="row-between">
                    <span>
                      Due{" "}
                      {dateLabel(goal.due_on, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <strong>{goal.progress}%</strong>
                  </div>
                </div>
              ))}
            {goals.data?.total === 0 && (
              <p className="muted tiny">
                Give your next step a name. Add a development goal.
              </p>
            )}
          </section>
          <section className="panel">
            <h2>Your conversation rhythm</h2>
            <ActivityChart data={data.trend} />
          </section>
        </div>
      </div>
    </>
  );
}
