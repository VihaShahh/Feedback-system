export type Role = "employee" | "manager" | "senior_management" | "admin";
export type Sentiment = "positive" | "balanced" | "needs_attention";
export type Capabilities = Record<
  | "team"
  | "organization"
  | "people_manage"
  | "grants_manage"
  | "cycles_manage"
  | "audit_read"
  | "feedback_export",
  boolean
>;
export interface Person {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  title: string;
  manager_id: string | null;
  active: boolean;
}
export interface Session {
  user: Person;
  capabilities: Capabilities;
}
export interface Page<T> {
  items: T[];
  total: number;
  offset?: number;
  limit?: number;
}
export interface Feedback {
  id: string;
  employee_id: string;
  employee_name: string;
  author_id: string;
  author_name: string;
  cycle_id: string | null;
  strengths: string;
  improvements: string;
  sentiment: Sentiment;
  state: "draft" | "published" | "archived";
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  acknowledged_at: string | null;
  acknowledged_version: number | null;
  escalated: boolean;
  escalation_note: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  capabilities: Record<
    | "edit"
    | "publish"
    | "archive"
    | "acknowledge"
    | "comment"
    | "escalate"
    | "resolve",
    boolean
  >;
}
export interface Revision {
  id: string;
  version: number;
  strengths: string;
  improvements: string;
  sentiment: Sentiment;
  created_at: string;
}
export interface Comment {
  id: string;
  author_name: string;
  author_id: string;
  body: string;
  created_at: string;
}
export interface Goal {
  id: string;
  employee_id: string;
  creator_id: string;
  title: string;
  description: string;
  due_on: string | null;
  progress: number;
  state: "active" | "completed" | "cancelled";
  version: number;
}
export interface CheckIn {
  id: string;
  employee_id: string;
  week_of: string;
  mood: "great" | "okay" | "struggling";
  workload: "light" | "balanced" | "heavy";
  note: string;
  response: string | null;
  responder_id: string | null;
}
export interface FeedbackRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  manager_id: string;
  topic: string;
  note: string;
  state: "open" | "fulfilled" | "cancelled";
  feedback_id: string | null;
  created_at: string;
}
export interface Notification {
  id: string;
  kind: string;
  message: string;
  resource_id: string | null;
  read_at: string | null;
  created_at: string;
}
export interface Cycle {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  state: "draft" | "open" | "closed";
}
export interface TeamMember {
  id: string;
  name: string;
  title: string;
  department: string;
  feedback_count: number;
  pending: number;
  latest_sentiment: Sentiment | null;
  latest_feedback_at: string | null;
}
export interface Dashboard {
  kind: string;
  metrics: Record<string, number | null>;
  sentiment: Record<Sentiment, number>;
  trend: { month: string; count: number }[];
  recent_feedback: Feedback[];
  team?: TeamMember[];
}
export interface Aggregate {
  suppressed: boolean;
  employee_count: number;
  feedback_count: number | null;
  participation_percent: number | null;
  sentiment: Record<Sentiment, number> | null;
}
export interface Organization extends Aggregate {
  minimum_cohort: number;
  departments: (Aggregate & { department: string })[];
}
export interface Audit {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: string;
}
