"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui";

const initialState: AuthFormState = {};

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <FieldError>{state.error}</FieldError>
      {state.success ? <p className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-foreground">{state.success}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send recovery link"}
      </Button>
    </form>
  );
}
