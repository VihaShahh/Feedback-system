import { useState } from "react";
import { api, json } from "../api";
import { useAction, useQuery } from "../hooks";
import { useSession } from "../session";
import type { Feedback, FeedbackRequest, Page } from "../types";
import { Select } from "../components/Fields";
import { ErrorPanel } from "../components/ErrorPanel";
export function FulfilRequest({
  request,
  saved,
}: {
  request: FeedbackRequest;
  saved: () => void;
}) {
  const { session } = useSession();
  const [feedback, setFeedback] = useState("");
  const query = useQuery<Page<Feedback>>(
    "/feedback?state=published&limit=100&employee_id=" +
      encodeURIComponent(request.employee_id),
  );
  const action = useAction();
  return (
    <form
      className="section-spacing"
      onSubmit={(event) => {
        event.preventDefault();
        void action.run(
          () =>
            api("/requests/" + request.id + "/fulfil", {
              method: "POST",
              body: json({ feedback_id: feedback }),
            }),
          saved,
        );
      }}
    >
      <Select
        label="Published feedback to share"
        value={feedback}
        required
        onChange={(event) => setFeedback(event.target.value)}
      >
        <option value="">Choose your published feedback</option>
        {query.data?.items
          .filter((row) => row.author_id === session?.user.id)
          .map((row) => (
            <option key={row.id} value={row.id}>
              {new Date(
                row.published_at || row.created_at,
              ).toLocaleDateString()}{" "}
              · {row.strengths.slice(0, 55)}
            </option>
          ))}
      </Select>
      <ErrorPanel error={query.error} retry={query.reload} />
      <ErrorPanel error={action.error} />
      <button className="button small" disabled={action.busy || !feedback}>
        Complete request
      </button>
    </form>
  );
}
