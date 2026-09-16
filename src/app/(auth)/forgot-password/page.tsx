import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-form";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a recovery link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
