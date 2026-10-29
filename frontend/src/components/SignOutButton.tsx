import { LogOut } from "lucide-react";
import { useSession } from "../session";
import { useAction } from "../hooks";
import { ErrorPanel } from "./ErrorPanel";
export function SignOutButton() {
  const { signOut } = useSession();
  const action = useAction();
  return (
    <>
      <button
        className="sign-out"
        disabled={action.busy}
        onClick={() => void action.run(signOut)}
      >
        <LogOut size={17} />
        {action.busy ? "Signing out…" : "Sign out"}
      </button>
      <ErrorPanel error={action.error} />
    </>
  );
}
