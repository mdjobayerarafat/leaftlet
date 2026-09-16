import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-form";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue reading."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
