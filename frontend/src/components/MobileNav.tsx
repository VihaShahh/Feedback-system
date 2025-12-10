import type { ReactNode } from "react";
import { Dialog } from "./Dialog";
export function MobileNav({
  close,
  children,
}: {
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog title="Workspace navigation" close={close}>
      <div
        className="mobile-links"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) close();
        }}
      >
        {children}
      </div>
    </Dialog>
  );
}
