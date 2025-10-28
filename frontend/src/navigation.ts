import type { Session } from "./types";
export interface NavItem {
  path: string;
  label: string;
  icon:
    | "overview"
    | "feedback"
    | "goals"
    | "checkins"
    | "requests"
    | "team"
    | "organization"
    | "people"
    | "cycles"
    | "audit";
}
export function defaultPath(session: Session) {
  return session.capabilities.team
    ? "/team"
    : session.capabilities.organization
      ? "/organization"
      : session.capabilities.people_manage
        ? "/people"
        : "/my-growth";
}
export function navigation(session: Session): NavItem[] {
  const c = session.capabilities;
  const items: NavItem[] = [];
  if (c.team)
    items.push(
      { path: "/team", label: "Team overview", icon: "overview" },
      { path: "/people", label: "My team", icon: "team" },
    );
  if (c.organization)
    items.push({
      path: "/organization",
      label: "Organization",
      icon: "organization",
    });
  if (c.people_manage)
    items.push({ path: "/people", label: "People", icon: "people" });
  items.push(
    { path: "/my-growth", label: "My growth", icon: "overview" },
    {
      path: "/feedback",
      label:
        session.user.role === "senior_management" ? "Escalations" : "Feedback",
      icon: "feedback",
    },
    { path: "/goals", label: "Development goals", icon: "goals" },
    { path: "/checkins", label: "Weekly check-ins", icon: "checkins" },
    { path: "/requests", label: "Feedback requests", icon: "requests" },
  );
  if (c.cycles_manage)
    items.push({ path: "/cycles", label: "Review cycles", icon: "cycles" });
  if (c.audit_read)
    items.push({ path: "/audit", label: "Activity log", icon: "audit" });
  return items;
}
