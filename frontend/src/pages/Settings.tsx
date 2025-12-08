import { useState } from "react";
import { api, json } from "../api";
import { useAction, useQuery } from "../hooks";
import { useSession } from "../session";
import { PageHeading, Avatar, dateLabel } from "../components/Primitives";
import { Input } from "../components/Fields";
import { Loading } from "../components/States";
import { ErrorPanel } from "../components/ErrorPanel";
interface LoginSession {
  id: string;
  created_at: string;
  expires_at: number;
  current: boolean;
}
export default function Settings() {
  const { session } = useSession();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const action = useAction();
  const revoke = useAction();
  const sessions = useQuery<{ items: LoginSession[] }>("/auth/sessions");
  return (
    <>
      <PageHeading
        eyebrow="YOUR ACCOUNT, WITH CARE"
        title="A little housekeeping."
        description="Keep your account and workspace sessions in good shape."
      />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="person-line">
            <Avatar name={session!.user.name} />
            <div>
              <h2>{session?.user.name}</h2>
              <p className="tiny muted">
                {session?.user.email} ·{" "}
                {session?.user.role.replaceAll("_", " ")}
              </p>
            </div>
          </div>
          <div className="detail-section section-spacing">
            <h2>Change your password</h2>
            <p className="tiny muted">
              Saving signs you out of every device, including this one.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void action.run(
                  () =>
                    api("/auth/password", {
                      method: "POST",
                      body: json({
                        current_password: current,
                        new_password: password,
                      }),
                    }),
                  () => window.dispatchEvent(new Event("session-expired")),
                );
              }}
            >
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
              {confirm && confirm !== password && (
                <p className="notice error">
                  The new passwords do not match yet.
                </p>
              )}
              <ErrorPanel error={action.error} />
              <button
                className="button primary"
                disabled={action.busy || password !== confirm}
              >
                Update password
              </button>
            </form>
          </div>
        </section>
        <section className="panel">
          <h2>Your active sessions</h2>
          <p className="tiny muted">
            Revoke a session when you no longer need it.
          </p>
          <ErrorPanel error={sessions.error} retry={sessions.reload} />
          <ErrorPanel error={revoke.error} />
          {sessions.loading ? (
            <Loading />
          ) : (
            sessions.data?.items.map((row) => (
              <div className="session-row" key={row.id}>
                <div>
                  <strong>
                    {row.current
                      ? "This workspace session"
                      : "Another signed-in session"}
                  </strong>
                  <p>
                    Started {dateLabel(row.created_at)}
                    <br />
                    Expires{" "}
                    {dateLabel(new Date(row.expires_at * 1000).toISOString())}
                  </p>
                </div>
                <button
                  className="button small"
                  disabled={revoke.busy}
                  onClick={() =>
                    void revoke.run(
                      () =>
                        api("/auth/sessions/" + row.id, { method: "DELETE" }),
                      () => {
                        row.current
                          ? window.dispatchEvent(new Event("session-expired"))
                          : sessions.reload();
                      },
                    )
                  }
                >
                  {row.current ? "Sign out" : "Revoke"}
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}
