import type { ReactNode } from "react";

export function EmptyState(props: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{props.icon}</div>
      <strong>{props.title}</strong>
      {props.children ? <p>{props.children}</p> : null}
    </div>
  );
}
