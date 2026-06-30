import Link from "next/link";
import Image from "next/image";
import { THEMES } from "@/lib/types/themes";
import { AuthButton } from "@/components/auth/AuthButton";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/music/lyrics", label: "Paroles" },
  { href: "/dashboard", label: "Progression" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c0b0f]">
      {/* Fond décoratif — vinyle / onde sonore */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.15), transparent), radial-gradient(circle at 90% 80%, rgba(139,92,246,0.08), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full border border-white/[0.03] opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-[calc(25%+1rem)] h-80 w-80 rounded-full border border-white/[0.02] opacity-20"
      />

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/logo64.png"
              alt="Nativly"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <span className="font-display text-xl tracking-tight text-zinc-100">
              Nativly
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 py-10">{children}</main>

      <footer className="relative z-10 border-t border-white/5 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-zinc-600">
          <p>Thèmes actifs : {THEMES.filter((t) => t.isActive).map((t) => t.name).join(", ")}</p>
          <p>Anglais par immersion — pas par niveau scolaire</p>
        </div>
      </footer>
    </div>
  );
}
