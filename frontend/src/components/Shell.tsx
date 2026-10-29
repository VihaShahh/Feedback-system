import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  MessageSquare,
  Target,
  Heart,
  Send,
  Users,
  Globe2,
  CalendarDays,
  ShieldCheck,
  Settings,
  Menu,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useSession } from "../session";
import { navigation } from "../navigation";
import { Avatar } from "./Primitives";
import { SignOutButton } from "./SignOutButton";
import { MobileNav } from "./MobileNav";
const icons = {
  overview: LayoutDashboard,
  feedback: MessageSquare,
  goals: Target,
  checkins: Heart,
  requests: Send,
  team: Users,
  organization: Globe2,
  people: Users,
  cycles: CalendarDays,
  audit: ShieldCheck,
};
export function Shell() {
  const { session } = useSession();
  const [mobile, setMobile] = useState(false);
  if (!session) return null;
  const links = (
    <nav aria-label="Main navigation">
      {navigation(session).map((item) => {
        const Icon = icons[item.icon];
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          gather<span className="brand-dot">.</span>
        </Link>
        <p className="sidebar-caption">A little feedback. A lot of growth.</p>
        <p className="nav-label">YOUR WORKSPACE</p>
        {links}
        <div className="sidebar-bottom">
          <div className="growth-note">
            <Sparkles size={20} />
            <strong>Growth is a conversation.</strong>
            <p>Make room for the next one.</p>
            <Link to="/requests">
              Start a conversation <ArrowUpRight size={15} />
            </Link>
          </div>
          <NavLink className="nav-link" to="/settings">
            <Settings size={18} />
            Settings
          </NavLink>
          <SignOutButton />
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> Feedback & growth
            </span>
          </div>
          <div className="topbar-right">
            <Link
              className="icon-button"
              to="/notifications"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </Link>
            <span className="topbar-divider" />
            <Avatar name={session.user.name} small />
            <div className="topbar-person">
              <strong>{session.user.name}</strong>
              <small>{session.user.role.replaceAll("_", " ")}</small>
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer>
          Better conversations. Stronger teams.
          <span>Made for the way people grow.</span>
        </footer>
      </div>
      {mobile && (
        <MobileNav close={() => setMobile(false)}>
          {links}
          <Link to="/settings" className="nav-link">
            Settings
          </Link>
          <SignOutButton />
        </MobileNav>
      )}
    </div>
  );
}
