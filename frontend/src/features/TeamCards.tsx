import { Link } from "react-router-dom";
import type { TeamMember } from "../types";
import { Avatar, Badge, dateLabel } from "../components/Primitives";
export function TeamCards({ people }: { people: TeamMember[] }) {
  return (
    <div className="team-cards">
      {people.map((person) => (
        <article className="panel team-card" key={person.id}>
          <div className="person-line">
            <Avatar name={person.name} />
            <div>
              <strong>{person.name}</strong>
              <small>{person.title || person.department}</small>
            </div>
          </div>
          <Badge value={person.latest_sentiment} />
          <div className="row-between">
            <span>Conversations</span>
            <strong>{person.feedback_count}</strong>
          </div>
          <div className="row-between">
            <span>Last feedback</span>
            <strong>
              {dateLabel(person.latest_feedback_at, {
                month: "short",
                day: "numeric",
              })}
            </strong>
          </div>
          <Link className="button small" to={"/people/" + person.id}>
            View growth profile
          </Link>
        </article>
      ))}
    </div>
  );
}
