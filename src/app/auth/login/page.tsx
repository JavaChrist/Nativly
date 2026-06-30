import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-zinc-500">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
