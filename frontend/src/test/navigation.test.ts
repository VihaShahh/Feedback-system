import { describe, expect, it } from "vitest";
import { defaultPath, navigation } from "../navigation";
import type { Session, Role } from "../types";
function session(
  role: Role,
  extra: Partial<Session["capabilities"]> = {},
): Session {
  return {
    user: {
      id: "person",
      name: "A Person",
      email: "person@example.com",
      role,
      department: "Engineering",
      title: "Engineer",
      manager_id: null,
      active: true,
    },
    capabilities: {
      team: role === "manager",
      organization: role === "senior_management",
      people_manage: role === "admin",
      grants_manage: role === "admin",
      cycles_manage: role === "admin",
      audit_read: role === "admin",
      feedback_export: false,
      ...extra,
    },
  };
}
describe("permission-aware navigation", () => {
  it("keeps employee navigation private and routes to personal growth", () => {
    const user = session("employee");
    expect(defaultPath(user)).toBe("/my-growth");
    expect(navigation(user).map((item) => item.path)).not.toContain("/people");
    expect(navigation(user).map((item) => item.path)).not.toContain(
      "/organization",
    );
  });
  it("gives managers a team workspace without administrative links", () => {
    const user = session("manager");
    expect(defaultPath(user)).toBe("/team");
    expect(navigation(user).some((item) => item.path === "/people")).toBe(true);
    expect(navigation(user).some((item) => item.path === "/audit")).toBe(false);
  });
  it("gives senior management summaries without account administration", () => {
    const user = session("senior_management");
    expect(defaultPath(user)).toBe("/organization");
    expect(
      navigation(user).find((item) => item.path === "/feedback")?.label,
    ).toBe("Escalations");
    expect(navigation(user).some((item) => item.path === "/people")).toBe(
      false,
    );
  });
  it("separates administrative and organization permissions", () => {
    const user = session("admin");
    expect(defaultPath(user)).toBe("/people");
    expect(navigation(user).some((item) => item.path === "/organization")).toBe(
      false,
    );
  });
  it("reflects an explicit organization privilege without changing the role", () => {
    const user = session("employee", { organization: true });
    expect(defaultPath(user)).toBe("/organization");
    expect(user.user.role).toBe("employee");
    expect(navigation(user).some((item) => item.path === "/audit")).toBe(false);
  });
});
