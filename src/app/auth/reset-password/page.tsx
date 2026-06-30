import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/PasswordField";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-zinc-500">Chargement...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
