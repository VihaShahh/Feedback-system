import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Sprout, Compass, Pencil, History } from "lucide-react";
import { useQuery } from "../hooks";
import type { Feedback } from "../types";
import { PageHeading, Badge, dateLabel } from "../components/Primitives";
import { Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
import { Acknowledge } from "../features/Acknowledge";
import { RevisionHistory } from "../features/RevisionHistory";
import { Conversation } from "../features/Conversation";
import { FeedbackActions } from "../features/FeedbackActions";
import { Escalation } from "../features/Escalation";
export default function FeedbackDetail() {
  const { id } = useParams();
  const query = useQuery<Feedback>("/feedback/" + id);
  const [history, setHistory] = useState(false);
  if (query.loading) return <Loading />;
  if (!query.data)
    return <ErrorPanel error={query.error} retry={query.reload} />;
  const row = query.data;
  return (
    <div className="content-width">
      <Link to="/feedback" className="section-link">
        <ArrowLeft size={14} />
        All feedback
      </Link>
      <PageHeading
        eyebrow={
          row.state === "draft"
            ? "PRIVATE DRAFT · VISIBLE ONLY TO YOU"
            : "A CONVERSATION FOR GROWTH"
        }
        title={`Feedback for ${row.employee_name.split(" ")[0]}`}
        description={`A perspective from ${row.author_name}.`}
        action={
          <>
            {row.capabilities.edit && (
              <Link className="button" to={"/feedback/" + row.id + "/edit"}>
                <Pencil size={14} />
                Edit
              </Link>
            )}
            <FeedbackActions feedback={row} reload={query.reload} />
          </>
        }
      />
      <div className="detail-meta">
        <Badge value={row.state === "draft" ? "draft" : row.sentiment} />
        <span>{dateLabel(row.published_at || row.created_at)}</span>
        <span>Version {row.version}</span>
        {row.state === "archived" && <Badge value="archived" />}
      </div>
      <article className="panel">
        <div className="detail-section">
          <h2>
            <Sprout size={18} />
            What’s working well
          </h2>
          <p className="detail-copy">{row.strengths}</p>
        </div>
        <div className="detail-section">
          <h2>
            <Compass size={18} />
            Room to grow
          </h2>
          <p className="detail-copy">{row.improvements}</p>
        </div>
        <div className="detail-section row-between">
          <Acknowledge feedback={row} reload={query.reload} />
          {row.state !== "draft" && (
            <button
              className="text-button"
              aria-expanded={history}
              onClick={() => setHistory((value) => !value)}
            >
              <History size={14} />
              {history ? "Hide revision history" : "View revision history"}
            </button>
          )}
        </div>
      </article>
      <Escalation feedback={row} reload={query.reload} />
      {history && <RevisionHistory id={row.id} />}
      <Conversation id={row.id} writable={row.capabilities.comment} />
    </div>
  );
}
