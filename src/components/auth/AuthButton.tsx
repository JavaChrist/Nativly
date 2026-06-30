"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <span className="text-xs text-zinc-600">...</span>;
  }

  if (!email) {
    return (
      <a
        href="/auth/login"
        className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
      >
        Connexion
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[140px] truncate text-xs text-zinc-500 sm:inline">
        {email}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      >
        Deconnexion
      </button>
    </div>
  );
}
