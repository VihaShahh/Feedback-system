import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, CheckCheck } from "lucide-react";
import type { Feedback } from "../types";
import { useSession } from "../session";
import { Avatar, Badge, dateLabel } from "./Primitives";
export function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const { session } = useSession();
  const own = session?.user.id === feedback.employee_id;
  return (
    <article className="feedback-card">
      <div className="feedback-card-top">
        <div className="person-line">
          <Avatar
            name={own ? feedback.author_name : feedback.employee_name}
            small
          />
          <div>
            <strong>
              {own ? feedback.author_name : feedback.employee_name}
            </strong>
            <small>
              {own
                ? "Feedback from your manager"
                : `From ${feedback.author_name}`}
            </small>
          </div>
        </div>
        <Badge
          value={feedback.state === "draft" ? "draft" : feedback.sentiment}
        />
      </div>
      <h3>What’s working well</h3>
      <p className="excerpt">{feedback.strengths}</p>
      <div className="card-footer">
        <div className="card-meta">
          <span>
            {dateLabel(feedback.published_at || feedback.created_at, {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span>·</span>
          {feedback.state === "draft" ? (
            <span>Private draft</span>
          ) : (
            <span className="ack-tag">
              {feedback.acknowledged_at ? (
                <>
                  <CheckCheck size={12} />
                  Acknowledged
                </>
              ) : (
                <>
                  <Clock3 size={12} />
                  Awaiting acknowledgement
                </>
              )}
            </span>
          )}
        </div>
        <Link className="section-link" to={"/feedback/" + feedback.id}>
          View feedback <ArrowUpRight size={13} />
        </Link>
      </div>
    </article>
  );
}
