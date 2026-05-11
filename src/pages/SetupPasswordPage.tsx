import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type SetupPasswordPayload, setupPasswordSchema } from "@/constants/schemas";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";
import { navigateAfterLogin } from "@/lib/utils";

export function SetupPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    data: tokenInfo,
    isLoading,
    error: tokenError,
  } = useQuery({
    queryKey: ["setup-password", token],
    queryFn: () =>
      apiClient.get<{ name: string; email: string }>(
        `${ApiRoutes.AUTH_SETUP_PASSWORD}?token=${encodeURIComponent(token)}`
      ),
    enabled: !!token,
    retry: false,
  });

  const form = useForm<SetupPasswordPayload>({
    resolver: zodResolver(setupPasswordSchema),
    defaultValues: { token, password: "" },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: SetupPasswordPayload) =>
      apiClient.post<{ token: string }>(ApiRoutes.AUTH_SETUP_PASSWORD, values),
    onSuccess: ({ token: jwt }) => navigateAfterLogin(login(jwt), navigate),
  });

  if (!token) {
    return (
      <AuthLayout>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid link</CardTitle>
            <CardDescription>This account setup link is missing a token.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={PageRoutes.LOGIN}>Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthLayout>
    );
  }

  if (tokenError || !tokenInfo) {
    return (
      <AuthLayout>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Link expired</CardTitle>
            <CardDescription>
              This account setup link is invalid or has expired. Try signing in to receive a new
              one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={PageRoutes.LOGIN}>Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Set up your password</CardTitle>
          <CardDescription>
            Hi {tokenInfo.name}! Choose a password for{" "}
            <span className="font-medium text-foreground">{tokenInfo.email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutate(v))} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <p className="text-sm text-destructive">{error.message}</p>}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Setting up..." : "Set password & sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
