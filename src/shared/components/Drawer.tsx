import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/components/Button";

type DrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Drawer({ open, title, subtitle, onClose, children }: DrawerProps) {
  return (
    <>
      <div className={`drawer-backdrop${open ? " open" : ""}`} onClick={onClose} />
      <aside className={`drawer${open ? " open" : ""}`} aria-hidden={!open} aria-label={title}>
        <div className="drawer-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p className="tiny">{subtitle}</p> : null}
          </div>
          <Button iconOnly aria-label="Close drawer" onClick={onClose}>
            <X className="icon" />
          </Button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </>
  );
}

