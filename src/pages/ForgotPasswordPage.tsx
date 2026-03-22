import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

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
import { type ForgotPasswordSchema, forgotPasswordSchema } from "@/constants/schemas";
import { apiClient } from "@/lib/api-client";

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: ForgotPasswordSchema) =>
      apiClient.post<{ success: boolean }>(ApiRoutes.AUTH_FORGOT_PASSWORD, values),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <AuthLayout>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              If an account with that email exists, we&apos;ve sent a password reset link. It
              expires in 1 hour.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              <Link to={PageRoutes.LOGIN} className="font-medium text-foreground hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutate(v))} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <p className="text-sm text-destructive">{error.message}</p>}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            <Link to={PageRoutes.LOGIN} className="font-medium text-foreground hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
