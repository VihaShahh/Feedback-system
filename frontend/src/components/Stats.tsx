import {
  MessageSquare,
  CheckCheck,
  Target,
  TrendingUp,
  Users,
  Heart,
  Send,
} from "lucide-react";
const icons = {
  feedback: MessageSquare,
  pending: CheckCheck,
  goals: Target,
  positive: TrendingUp,
  people: Users,
  attention: Heart,
  requests: Send,
};
export function Stat({
  label,
  value,
  foot,
  icon,
}: {
  label: string;
  value: number | string | null | undefined;
  foot: string;
  icon: keyof typeof icons;
}) {
  const Icon = icons[icon];
  return (
    <div className="panel stat">
      <span className="stat-dot" />
      <span className="stat-icon">
        <Icon size={18} />
      </span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value ?? "—"}</strong>
      <small className="stat-foot">{foot}</small>
    </div>
  );
}
