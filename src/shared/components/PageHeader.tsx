import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
      </div>
      {actions}
    </div>
  );
}

