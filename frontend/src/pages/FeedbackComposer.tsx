import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { api, ApiError, json } from "../api";
import { useQuery } from "../hooks";
import { useSession } from "../session";
import type { Cycle, Feedback, Page, Person, Sentiment } from "../types";
import { PageHeading } from "../components/Primitives";
import { Input, Select, Textarea } from "../components/Fields";
import { Loading, Empty } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
import { ConflictPanel } from "../features/ConflictPanel";
import { validateFeedback } from "../features/feedbackValidation";
function Editor({ record }: { record?: Feedback }) {
  const { session } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [employee, setEmployee] = useState(
    record?.employee_id || params.get("employee_id") || "",
  );
  const [search, setSearch] = useState("");
  const people = useQuery<Page<Person>>(
    "/people?team_only=true&limit=100&q=" + encodeURIComponent(search),
  );
  const cycles = useQuery<{ items: Cycle[] }>("/cycles");
  const [cycle, setCycle] = useState(record?.cycle_id || "");
  const [strengths, setStrengths] = useState(record?.strengths || "");
  const [improvements, setImprovements] = useState(record?.improvements || "");
  const [sentiment, setSentiment] = useState<Sentiment>(
    record?.sentiment || "positive",
  );
  const [version, setVersion] = useState(record?.version || 1);
  const [error, setError] = useState<Error>();
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<Feedback>();
  const [validation, setValidation] = useState<Record<string, string>>({});
  async function save() {
    const errors = validateFeedback({
      employee_id: employee,
      strengths,
      improvements,
      sentiment,
    });
    setValidation(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setError(undefined);
    try {
      const row = await api<Feedback>(
        record ? "/feedback/" + record.id : "/feedback",
        {
          method: record ? "PATCH" : "POST",
          body: json(
            record
              ? { version, strengths, improvements, sentiment }
              : {
                  employee_id: employee,
                  cycle_id: cycle || null,
                  strengths,
                  improvements,
                  sentiment,
                },
          ),
        },
      );
      navigate("/feedback/" + row.id);
    } catch (reason) {
      setError(reason as Error);
      if (reason instanceof ApiError && reason.status === 409 && record) {
        try {
          setLatest(await api<Feedback>("/feedback/" + record.id));
        } catch (reloadError) {
          setError(reloadError as Error);
        }
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="content-width">
      <Link
        to={record ? "/feedback/" + record.id : "/feedback"}
        className="section-link"
      >
        <ArrowLeft size={14} />
        Back to feedback
      </Link>
      <PageHeading
        eyebrow="MAKE YOUR WORDS COUNT"
        title={record ? "A thoughtful update." : "A perspective worth sharing."}
        description="Be specific. Be kind. Give the conversation somewhere to go."
      />
      <div className="panel">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {record ? (
            <p className="notice info">
              Feedback for {record.employee_name} · version {version}
            </p>
          ) : (
            <>
              <Input
                label="Find a direct report"
                value={search}
                placeholder="Search your team"
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select
                label="Who is this feedback for?"
                value={employee}
                required
                onChange={(event) => setEmployee(event.target.value)}
              >
                <option value="">Choose a direct report</option>
                {people.data?.items
                  .filter(
                    (person) =>
                      person.manager_id === session?.user.id && person.active,
                  )
                  .map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
              </Select>
              <ErrorPanel error={people.error} retry={people.reload} />
              <Select
                label="Review cycle"
                value={cycle}
                onChange={(event) => setCycle(event.target.value)}
              >
                <option value="">Outside a review cycle</option>
                {cycles.data?.items
                  .filter((row) => row.state === "open")
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
              </Select>
              <ErrorPanel error={cycles.error} retry={cycles.reload} />
            </>
          )}
          <Textarea
            label="What’s working well?"
            hint="Use a specific example of their strengths and the difference they made."
            required
            maxLength={4000}
            value={strengths}
            onChange={(event) => setStrengths(event.target.value)}
          />
          <Textarea
            label="Where is there room to grow?"
            hint="Describe a constructive next step and the support that could help."
            required
            maxLength={4000}
            value={improvements}
            onChange={(event) => setImprovements(event.target.value)}
          />
          <Select
            label="Overall sentiment"
            value={sentiment}
            onChange={(event) => setSentiment(event.target.value as Sentiment)}
          >
            <option value="positive">
              Positive — celebrate what’s working
            </option>
            <option value="balanced">
              Balanced — strengths and development
            </option>
            <option value="needs_attention">
              Needs attention — offer extra support
            </option>
          </Select>
          {Object.values(validation).map((message) => (
            <p className="notice error" role="alert" key={message}>
              {message}
            </p>
          ))}
          <ErrorPanel error={error} />
          {latest && (
            <ConflictPanel
              latest={latest}
              useLatest={() => {
                setStrengths(latest.strengths);
                setImprovements(latest.improvements);
                setSentiment(latest.sentiment);
                setVersion(latest.version);
                setLatest(undefined);
                setError(undefined);
              }}
              keepLocal={() => {
                setVersion(latest.version);
                setLatest(undefined);
                setError(undefined);
              }}
            />
          )}
          <div className="notice info">
            <LockKeyhole size={17} />
            {record?.state === "published"
              ? "Saving a published update creates a new revision and asks the employee to acknowledge it again."
              : "Your draft stays private until you choose to publish it."}
          </div>
          <div className="form-actions">
            <Link
              className="button"
              to={record ? "/feedback/" + record.id : "/feedback"}
            >
              Cancel
            </Link>
            <button
              className="button primary"
              disabled={busy || Boolean(latest)}
            >
              {busy
                ? "Saving…"
                : record?.state === "published"
                  ? "Save published update"
                  : "Save draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default function FeedbackComposer() {
  const { id } = useParams();
  const query = useQuery<Feedback>(id ? "/feedback/" + id : null);
  if (id && query.loading) return <Loading />;
  if (id && !query.data)
    return <ErrorPanel error={query.error} retry={query.reload} />;
  if (query.data && !query.data.capabilities.edit)
    return (
      <Empty
        title="This feedback is read-only"
        description="Only the author who is also the current manager can edit this conversation."
      />
    );
  return <Editor record={query.data} key={id || "new"} />;
}
