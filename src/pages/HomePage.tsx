import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { PageRoutes } from "@/constants/routes";

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-4xl font-semibold">Welcome</h1>

      {user ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground">
            Signed in as <span className="text-foreground font-medium">{user.email}</span>
          </p>
          <div className="flex gap-2">
            {user.role === "ADMIN" && (
              <Button asChild>
                <Link to={PageRoutes.ADMIN}>Admin Dashboard</Link>
              </Button>
            )}
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button asChild>
            <Link to={PageRoutes.LOGIN}>Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={PageRoutes.REGISTER}>Register</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
