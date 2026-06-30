import Link from "next/link";
import { THEMES } from "@/lib/types/themes";

export default function HomePage() {
  const activeThemes = THEMES.filter((t) => t.isActive);

  return (
    <div className="mx-auto max-w-4xl">
      <section className="mb-16 pt-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-amber-500/80">
          Apprentissage par immersion
        </p>
        <h1 className="font-display text-5xl font-light leading-tight text-zinc-50 sm:text-6xl">
          Apprenez l&apos;anglais
          <span className="block bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            sur ce qui vous passionne
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Nativly génère du contenu pédagogique à partir de vos centres
          d&apos;intérêt réels — vos chansons, vos voyages, votre métier — avec
          un double niveau CECRL écrit/oral et un coaching de prononciation
          natif.
        </p>
      </section>

      <section className="mb-16 grid gap-4 sm:grid-cols-3">
        {THEMES.map((theme) => (
          <article
            key={theme.slug}
            className={`relative overflow-hidden rounded-2xl border p-6 transition ${
              theme.isActive
                ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                : "border-white/5 bg-white/[0.02] opacity-50"
            }`}
          >
            <h2 className="mb-2 font-display text-xl text-zinc-100">
              {theme.name}
            </h2>
            <p className="mb-4 text-sm text-zinc-500">{theme.description}</p>
            {theme.isActive ? (
              <Link
                href={theme.route}
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300"
              >
                Commencer →
              </Link>
            ) : (
              <span className="text-xs text-zinc-600">Bientôt</span>
            )}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
        <h2 className="mb-6 font-display text-2xl text-zinc-100">
          Par où commencer ?
        </h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-400">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-200">
                Connexion et test de niveau
              </p>
              <p className="text-sm text-zinc-500">
                Compte requis — onboarding avec double niveau CECRL
              </p>
              <Link
                href="/auth/login"
                className="mt-2 inline-block text-sm text-amber-400 hover:text-amber-300"
              >
                Creer un compte / Se connecter
              </Link>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm text-amber-300">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-200">
                Module Paroles — {activeThemes[0]?.name}
              </p>
              <p className="text-sm text-zinc-500">
                Collez vos paroles, obtenez vocabulaire + exercices
              </p>
              <Link
                href="/music/lyrics"
                className="mt-2 inline-block text-sm text-amber-400 hover:text-amber-300"
              >
                Ouvrir le module →
              </Link>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-400">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-200">
                Dashboard progression
              </p>
              <p className="text-sm text-zinc-500">
                Niveaux, mots a reviser, lecons sauvegardees
              </p>
              <Link
                href="/dashboard"
                className="mt-2 inline-block text-sm text-amber-400 hover:text-amber-300"
              >
                Voir la progression
              </Link>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
