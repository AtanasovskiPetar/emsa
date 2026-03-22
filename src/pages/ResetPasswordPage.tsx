import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";

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
import { type ResetPasswordSchema, resetPasswordSchema } from "@/constants/schemas";
import { apiClient } from "@/lib/api-client";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "" },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: ResetPasswordSchema) =>
      apiClient.post<{ success: boolean }>(ApiRoutes.AUTH_RESET_PASSWORD, values),
    onSuccess: () => setDone(true),
  });

  if (!token) {
    return (
      <AuthLayout>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid link</CardTitle>
            <CardDescription>This password reset link is missing a token.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={PageRoutes.FORGOT_PASSWORD}>Request a new link</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Password updated</CardTitle>
            <CardDescription>Your password has been reset successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={PageRoutes.LOGIN}>Sign in</Link>
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
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutate(v))} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <p className="text-sm text-destructive">{error.message}</p>}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Updating..." : "Update password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
