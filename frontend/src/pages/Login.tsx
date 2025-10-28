import { useState } from "react";
import { ArrowRight, Sprout, MessageSquare, ShieldCheck } from "lucide-react";
import { useSession } from "../session";
import { useAction } from "../hooks";
import { Input } from "../components/Fields";
import { ErrorPanel } from "../components/ErrorPanel";
export default function Login() {
  const { signIn } = useSession();
  const action = useAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="login-layout">
      <section className="login-story">
        <div className="brand light">
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          gather.
        </div>
        <div>
          <span className="login-kicker">
            <Sprout size={18} /> ROOM TO GROW
          </span>
          <h1>
            Great teams grow
            <br />
            through honest
            <br />
            <em>conversations.</em>
          </h1>
          <p>
            A thoughtful space for feedback, reflection, and the small steps
            that make a big difference.
          </p>
          <div className="story-note">
            <MessageSquare size={24} />
            <span>
              When people feel heard,
              <br />
              <strong>good things happen.</strong>
            </span>
          </div>
        </div>
        <small>Feedback that moves you forward.</small>
      </section>
      <section className="login-form-panel">
        <div className="login-form">
          <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
          <h2>Good to have you here.</h2>
          <p>Sign in to keep your growth conversation going.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action.run(() => signIn(email, password));
            }}
          >
            <Input
              label="Work email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <ErrorPanel error={action.error} />
            <button className="button primary full" disabled={action.busy}>
              {action.busy ? "Signing in…" : "Sign in"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-help">
            Need access? Your workspace administrator can create an account for
            you.
          </p>
          <div className="private-note">
            <ShieldCheck size={17} />
            Your feedback stays with the right people.
          </div>
        </div>
      </section>
    </div>
  );
}
