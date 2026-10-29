import { api, json } from "../api";
import { useAction, useQuery } from "../hooks";
import { useSession } from "../session";
import type { Person } from "../types";
import { Dialog } from "../components/Dialog";
import { Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
const descriptions: Record<string, string> = {
  "people.manage": "Manage employee accounts and reporting lines",
  "grants.manage":
    "Role-level grant administration remains restricted to administrators",
  "cycles.manage": "Create and transition review cycles",
  "audit.read": "Read metadata-only workspace activity",
  "dashboard.organization": "View privacy-protected organization summaries",
  "feedback.read_organization":
    "Read published feedback across the organization",
  "feedback.export": "Export feedback within existing reading permissions",
};
export function Grants({
  person,
  close,
}: {
  person: Person;
  close: () => void;
}) {
  const { session } = useSession();
  const query = useQuery<{ items: string[]; available: string[] }>(
    "/people/" + person.id + "/grants",
  );
  const action = useAction();
  return (
    <Dialog title={"Privileges for " + person.name} close={close}>
      <p className="dialog-copy">
        Privileges extend this account’s role. Drafts remain private to their
        author. Changes revoke this account’s sessions.
      </p>
      <ErrorPanel error={query.error} retry={query.reload} />
      <ErrorPanel error={action.error} />
      {query.loading ? (
        <Loading />
      ) : (
        query.data?.available.map((permission) => {
          const granted = query.data!.items.includes(permission);
          return (
            <div className="grant-row" key={permission}>
              <div>
                <code>{permission}</code>
                <p className="tiny muted">{descriptions[permission]}</p>
              </div>
              <button
                className="button small"
                disabled={action.busy}
                aria-label={(granted ? "Revoke " : "Grant ") + permission}
                onClick={() =>
                  void action.run(
                    () =>
                      api(
                        "/people/" +
                          person.id +
                          "/grants" +
                          (granted ? "/" + permission : ""),
                        {
                          method: granted ? "DELETE" : "POST",
                          ...(granted ? {} : { body: json({ permission }) }),
                        },
                      ),
                    () => {
                      if (person.id === session?.user.id)
                        window.dispatchEvent(new Event("session-expired"));
                      else query.reload();
                    },
                  )
                }
              >
                {granted ? "Revoke" : "Grant"}
              </button>
            </div>
          );
        })
      )}
    </Dialog>
  );
}
