import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageRoutes } from "@/constants/routes";
import { useAuth } from "@/context/auth";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session</CardTitle>
        <CardDescription>Currently logged in as</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <p>
          <span className="text-muted-foreground">Email:</span> {user.email}
        </p>
        <p>
          <span className="text-muted-foreground">Role:</span> {user.role}
        </p>
        <p>
          <span className="text-muted-foreground">ID:</span>{" "}
          <span className="font-mono text-xs">{user.id}</span>
        </p>
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(PageRoutes.PROFILE)}>
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
