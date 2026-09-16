"use client";

import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="danger">Sign out</Button>
    </form>
  );
}
