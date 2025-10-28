import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./session";
import { defaultPath } from "./navigation";
import { Shell } from "./components/Shell";
import { ErrorPanel } from "./components/ErrorPanel";
import { Empty, Loading } from "./components/States";
import Login from "./pages/Login";
const modules = import.meta.glob<{ default: ComponentType }>([
  "./pages/*.tsx",
  "!./pages/Login.tsx",
]);
const screens = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [path, lazy(load)]),
);
function Screen({ name, allowed = true }: { name: string; allowed?: boolean }) {
  const Component = screens[`./pages/${name}.tsx`];
  if (!allowed)
    return (
      <Empty
        title="This area needs a different permission"
        description="Your workspace administrator can help you with access."
        action={<Link to="/">Back to your workspace</Link>}
      />
    );
  return Component ? (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  ) : (
    <Empty
      title="Your workspace is taking shape"
      description="There is nothing to show in this section yet."
    />
  );
}
export default function App() {
  const { session, loading, error, reload } = useSession();
  if (loading) return <Loading />;
  if (!session)
    return error ? (
      <div className="standalone">
        <ErrorPanel error={error} retry={reload} />
      </div>
    ) : (
      <Login />
    );
  const c = session.capabilities;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to={defaultPath(session)} replace />} />
        <Route path="my-growth" element={<Screen name="Personal" />} />
        <Route path="team" element={<Screen name="Team" allowed={c.team} />} />
        <Route
          path="organization"
          element={<Screen name="Organization" allowed={c.organization} />}
        />
        <Route
          path="people"
          element={<Screen name="People" allowed={c.team || c.people_manage} />}
        />
        <Route
          path="people/:employeeId"
          element={<Screen name="Employee" allowed={c.team} />}
        />
        <Route path="feedback" element={<Screen name="FeedbackList" />} />
        <Route
          path="feedback/new"
          element={<Screen name="FeedbackComposer" allowed={c.team} />}
        />
        <Route path="feedback/:id" element={<Screen name="FeedbackDetail" />} />
        <Route
          path="feedback/:id/edit"
          element={<Screen name="FeedbackComposer" allowed={c.team} />}
        />
        <Route path="goals" element={<Screen name="Goals" />} />
        <Route path="checkins" element={<Screen name="CheckIns" />} />
        <Route path="requests" element={<Screen name="Requests" />} />
        <Route path="notifications" element={<Screen name="Notifications" />} />
        <Route
          path="cycles"
          element={<Screen name="Cycles" allowed={c.cycles_manage} />}
        />
        <Route
          path="audit"
          element={<Screen name="Audit" allowed={c.audit_read} />}
        />
        <Route path="settings" element={<Screen name="Settings" />} />
        <Route
          path="*"
          element={
            <Empty
              title="This page has moved"
              description="Head back to your workspace to find what you need."
              action={<Link to="/">Back to workspace</Link>}
            />
          }
        />
      </Route>
    </Routes>
  );
}
