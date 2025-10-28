import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, json } from "./api";
import type { Session } from "./types";

interface AuthContext {
  session: Session | null;
  loading: boolean;
  error?: Error;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reload: () => void;
}
const Context = createContext<AuthContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const reload = useCallback(() => {
    setLoading(true);
    setError(undefined);
    api<Session>("/auth/me")
      .then(setSession)
      .catch((reason: Error & { status?: number }) => {
        setSession(null);
        if (reason.status !== 401) setError(reason);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    reload();
    const expire = () => setSession(null);
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, [reload]);
  async function signIn(email: string, password: string) {
    setSession(
      await api<Session>("/auth/login", {
        method: "POST",
        body: json({ email, password }),
      }),
    );
  }
  async function signOut() {
    await api<void>("/auth/logout", { method: "POST" });
    setSession(null);
  }
  return (
    <Context.Provider
      value={{ session, loading, error, signIn, signOut, reload }}
    >
      {children}
    </Context.Provider>
  );
}

export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("Session provider is required");
  return value;
}
