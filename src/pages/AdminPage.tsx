import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageRoutes } from "@/constants/routes";

export function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(PageRoutes.LOGIN);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Currently logged in as</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span> {user?.email}
            </p>
            <p>
              <span className="text-muted-foreground">Role:</span> {user?.role}
            </p>
            <p>
              <span className="text-muted-foreground">ID:</span>{" "}
              <span className="font-mono text-xs">{user?.id}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
