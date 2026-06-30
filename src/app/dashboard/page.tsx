import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { CefrLevel } from "@/lib/types/cefr";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("user_profile")
    .select("written_cefr_level, spoken_fluency_cefr_level, last_calibrated_at")
    .eq("user_id", user.id)
    .single();

  const today = new Date().toISOString().split("T")[0];

  const { count: reviewCount } = await supabase
    .from("review_schedule")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_review_date", today);

  const { count: vocabCount } = await supabase
    .from("vocabulary_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const written = (profile?.written_cefr_level as CefrLevel) ?? "A2";
  const spoken = (profile?.spoken_fluency_cefr_level as CefrLevel) ?? "A2";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 font-display text-4xl text-zinc-50">Progression</h1>
      <p className="mb-10 text-zinc-500">
        Metriques honnetes — pas de gamification artificielle.
      </p>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Niveau ecrit
          </p>
          <p className="mt-2 font-display text-4xl text-amber-400">{written}</p>
        </article>
        <article className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Fluidite orale
          </p>
          <p className="mt-2 font-display text-4xl text-violet-400">{spoken}</p>
        </article>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Mots appris" value={vocabCount ?? 0} />
        <Stat label="A reviser aujourd'hui" value={reviewCount ?? 0} />
        <Stat label="Lecons generees" value={lessonCount ?? 0} />
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/music/lyrics"
          className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
        >
          Nouvelle analyse
        </Link>
        <Link
          href="/onboarding?recalibrate=1"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-zinc-400 hover:bg-white/5"
        >
          Recalibrer le niveau
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-200">{value}</p>
    </article>
  );
}
