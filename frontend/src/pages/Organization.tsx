import { useSearchParams, Link } from "react-router-dom";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { useQuery } from "../hooks";
import type { Organization as Org } from "../types";
import { PageHeading } from "../components/Primitives";
import { Stat } from "../components/Stats";
import { SentimentChart } from "../components/Charts";
import { PeriodFilters } from "../components/PeriodFilters";
import { DepartmentDistribution } from "../features/DepartmentDistribution";
import { Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
export default function Organization() {
  const [params] = useSearchParams();
  const query = useQuery<Org>("/dashboards/organization?" + params);
  if (query.loading) return <Loading />;
  if (!query.data)
    return <ErrorPanel error={query.error} retry={query.reload} />;
  const data = query.data;
  return (
    <>
      <PageHeading
        eyebrow="A WIDER PERSPECTIVE"
        title="A healthy culture starts with listening."
        description="A considered view of growth conversations across your organization."
        action={
          <Link className="button" to="/feedback">
            Review escalations <ArrowUpRight size={14} />
          </Link>
        }
      />
      <PeriodFilters />
      <div className="stats">
        <Stat
          label="People in the organization"
          value={data.employee_count}
          foot="Active employees and managers"
          icon="people"
        />
        <Stat
          label="Feedback conversations"
          value={data.feedback_count}
          foot="Published in this view"
          icon="feedback"
        />
        <Stat
          label="Participation"
          value={
            data.participation_percent === null
              ? null
              : data.participation_percent + "%"
          }
          foot="People receiving feedback"
          icon="positive"
        />
        <Stat
          label="Privacy threshold"
          value={data.minimum_cohort}
          foot="Distinct recipients per view"
          icon="goals"
        />
      </div>
      <div className="dashboard-grid">
        <DepartmentDistribution data={data} />
        <div className="stack">
          <section className="panel">
            <h2>The organization’s feedback picture</h2>
            {data.suppressed || !data.sentiment ? (
              <div className="privacy-note">
                <ShieldCheck size={22} />
                <p>
                  This view is protected until feedback includes at least{" "}
                  {data.minimum_cohort} distinct recipients. Individual feedback
                  is never included in these summaries.
                </p>
              </div>
            ) : (
              <SentimentChart counts={data.sentiment} />
            )}
          </section>
          <section className="panel">
            <h2>A perspective, held with care.</h2>
            <p className="privacy-note">
              <ShieldCheck size={22} />
              Small groups stay protected. Use these insights to open a
              conversation, and review individually escalated feedback when
              someone asks for support.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
