import { Link, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/shared/auth";
import { Button } from "./button";

export function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-foreground/10 px-4 h-14">
        <Link to="/" className="font-medium">
          App
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/70">{user?.name}</span>
            <Button size="sm" variant="outline" onClick={() => logout()}>
              登出
            </Button>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
