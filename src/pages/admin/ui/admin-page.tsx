import { RequireRole } from "@/shared/auth";

export function AdminPage() {
  return (
    <RequireRole role="admin">
      <div className="p-8">
        <h1 className="text-lg font-medium">Admin Area</h1>
        <p className="text-foreground/60">只有 admin 角色看得到這個頁面。</p>
      </div>
    </RequireRole>
  );
}
