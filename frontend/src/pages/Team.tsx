import { Link, useSearchParams } from "react-router-dom";
import { Plus, ArrowUpRight } from "lucide-react";
import { useSession } from "../session";
import { useQuery } from "../hooks";
import type { Dashboard } from "../types";
import { PageHeading } from "../components/Primitives";
import { Stat } from "../components/Stats";
import { SentimentChart, ActivityChart } from "../components/Charts";
import { FeedbackCard } from "../components/FeedbackCard";
import { TeamCards } from "../features/TeamCards";
import { PeriodFilters } from "../components/PeriodFilters";
import { Loading, Empty } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
export default function Team() {
  const { session } = useSession();
  const [params] = useSearchParams();
  const query = useQuery<Dashboard>("/dashboards/team?" + params);
  if (query.loading) return <Loading />;
  if (!query.data)
    return <ErrorPanel error={query.error} retry={query.reload} />;
  const data = query.data;
  return (
    <>
      <PageHeading
        eyebrow="GOOD TEAMS GROW TOGETHER"
        title={`A little more clarity for your team, ${session?.user.name.split(" ")[0]}.`}
        description="Celebrate the progress. Make space for the conversations that matter."
        action={
          <Link className="button primary" to="/feedback/new">
            <Plus size={16} />
            Write feedback
          </Link>
        }
      />
      <PeriodFilters />
      <div className="stats">
        <Stat
          label="People in your team"
          value={data.metrics.team_size}
          foot="Your current direct reports"
          icon="people"
        />
        <Stat
          label="Feedback shared"
          value={data.metrics.feedback_shared}
          foot="Published in this view"
          icon="feedback"
        />
        <Stat
          label="Awaiting acknowledgement"
          value={data.metrics.pending_acknowledgements}
          foot="Room for a conversation"
          icon="pending"
        />
        <Stat
          label="Needs a little support"
          value={data.metrics.needs_attention}
          foot="Conversations to follow up"
          icon="attention"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>The latest conversations</h2>
              <p>A little context for your next one-to-one.</p>
            </div>
            <Link className="section-link" to="/feedback">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {data.recent_feedback.map((row) => (
            <FeedbackCard key={row.id} feedback={row} />
          ))}
          {data.recent_feedback.length === 0 && (
            <Empty
              title="Your next conversation starts here"
              description="Share a thoughtful perspective with someone on your team."
            />
          )}
        </section>
        <div className="stack">
          <section className="panel">
            <h2>Your team’s feedback picture</h2>
            <SentimentChart counts={data.sentiment} />
          </section>
          <section className="panel">
            <h2>A steady conversation rhythm</h2>
            <ActivityChart data={data.trend} />
          </section>
          <section className="panel">
            <h2>A little attention goes a long way</h2>
            <p className="muted tiny">
              {data.metrics.open_requests} open feedback requests ·{" "}
              {data.metrics.active_goals} active goals
            </p>
            <Link className="section-link" to="/requests">
              Review team requests <ArrowUpRight size={14} />
            </Link>
          </section>
        </div>
      </div>
      <div className="panel-heading section-spacing">
        <h2>The people behind the progress</h2>
        <Link className="section-link" to="/people">
          My team <ArrowUpRight size={14} />
        </Link>
      </div>
      <TeamCards people={data.team || []} />
    </>
  );
}
