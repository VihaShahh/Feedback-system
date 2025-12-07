import { ShieldCheck } from "lucide-react";
import type { Organization } from "../types";
import { SentimentChart } from "../components/Charts";
export function DepartmentDistribution({ data }: { data: Organization }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Every team has a different rhythm</h2>
          <p>Feedback perspectives across departments.</p>
        </div>
      </div>
      {data.departments.map((row) => (
        <article className="department-bar" key={row.department}>
          <div className="row-between">
            <strong>{row.department}</strong>
            <span className="muted">
              {row.suppressed
                ? "Protected view"
                : row.feedback_count + " conversations"}
            </span>
          </div>
          {row.suppressed || !row.sentiment ? (
            <p className="privacy-note">
              <ShieldCheck size={16} />
              More participation is needed to show this team’s feedback picture.
            </p>
          ) : (
            <SentimentChart counts={row.sentiment} />
          )}
        </article>
      ))}
    </section>
  );
}
