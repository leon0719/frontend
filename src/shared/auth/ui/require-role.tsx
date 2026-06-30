import type { ReactNode } from "react";
import { usePermission } from "../lib/use-permission";
import type { Role } from "../model/types";

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const { hasRole } = usePermission();
  if (!hasRole(role)) {
    return (
      fallback ?? (
        <div className="p-8 text-center text-destructive">403 — 您沒有存取此頁面的權限</div>
      )
    );
  }
  return <>{children}</>;
}
