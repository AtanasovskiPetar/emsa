import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth";

export function DashboardPage() {
  const { user } = useAuth();

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
      </CardContent>
    </Card>
  );
}
