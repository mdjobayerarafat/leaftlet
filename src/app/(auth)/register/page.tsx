import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-form";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Build a personal library and read anywhere."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
