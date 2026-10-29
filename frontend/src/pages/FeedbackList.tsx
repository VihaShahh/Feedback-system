import { Link, useSearchParams } from "react-router-dom";
import { Plus, MessageSquare } from "lucide-react";
import { useSession } from "../session";
import { useQuery } from "../hooks";
import type { Feedback, Page, Cycle } from "../types";
import { PageHeading } from "../components/Primitives";
import { FeedbackCard } from "../components/FeedbackCard";
import { Select } from "../components/Fields";
import { Loading, Empty } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
import { ExportButton } from "../features/ExportButton";
export default function FeedbackList() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const state = params.get("state") || "";
  const sentiment = params.get("sentiment") || "";
  const cycle = params.get("cycle_id") || "";
  const offset = Number(params.get("offset") || 0);
  const senior = session?.user.role === "senior_management";
  const queryParams = new URLSearchParams({
    limit: "10",
    offset: String(Number.isFinite(offset) && offset >= 0 ? offset : 0),
  });
  if (state) queryParams.set("state", state);
  if (sentiment) queryParams.set("sentiment", sentiment);
  if (cycle) queryParams.set("cycle_id", cycle);
  if (senior) queryParams.set("escalated", "true");
  const query = useQuery<Page<Feedback>>("/feedback?" + queryParams);
  const cycles = useQuery<{ items: Cycle[] }>("/cycles");
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.delete("offset");
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };
  const tabs = [
    ["", "All feedback"],
    ["published", "Published"],
    ...(session?.capabilities.team ? [["draft", "Drafts"]] : []),
    ["archived", "Archived"],
  ];
  return (
    <>
      <PageHeading
        eyebrow={senior ? "SENIOR MANAGEMENT" : "CONVERSATIONS THAT MATTER"}
        title={
          senior
            ? "Make space for resolution."
            : "A fresh perspective, a clearer path."
        }
        description={
          senior
            ? "Review the conversations shared with you for additional support."
            : "Your feedback history, with room to reflect and move forward."
        }
        action={
          <>
            <ExportButton />
            {session?.capabilities.team && (
              <Link className="button primary" to="/feedback/new">
                <Plus size={16} />
                Write feedback
              </Link>
            )}
          </>
        }
      />
      <div className="tabs" aria-label="Feedback state">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            className={"tab " + (state === value ? "active" : "")}
            aria-pressed={state === value}
            onClick={() => update("state", value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <Select
          label="Sentiment"
          value={sentiment}
          onChange={(event) => update("sentiment", event.target.value)}
        >
          <option value="">All sentiments</option>
          <option value="positive">Positive</option>
          <option value="balanced">Balanced</option>
          <option value="needs_attention">Needs attention</option>
        </Select>
        <Select
          label="Review cycle"
          value={cycle}
          onChange={(event) => update("cycle_id", event.target.value)}
        >
          <option value="">All review cycles</option>
          {cycles.data?.items.map((row) => (
            <option value={row.id} key={row.id}>
              {row.name}
            </option>
          ))}
        </Select>
      </div>
      <ErrorPanel error={query.error} retry={query.reload} />
      {query.loading ? (
        <Loading />
      ) : query.data?.items.length ? (
        <div className="content-width">
          {query.data.items.map((row) => (
            <FeedbackCard feedback={row} key={row.id} />
          ))}
          <div className="pagination">
            <span>
              {offset + 1}–{Math.min(offset + 10, query.data.total)} of{" "}
              {query.data.total}
            </span>
            <button
              className="button small"
              disabled={offset <= 0}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("offset", String(Math.max(0, offset - 10)));
                setParams(next);
              }}
            >
              Previous
            </button>
            <button
              className="button small"
              disabled={offset + 10 >= query.data.total}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("offset", String(offset + 10));
                setParams(next);
              }}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        !query.error && (
          <div className="panel">
            <Empty
              title="No conversations in this view yet"
              description="Try a different filter, or start a new feedback conversation."
              action={<MessageSquare size={24} />}
            />
          </div>
        )
      )}
    </>
  );
}
