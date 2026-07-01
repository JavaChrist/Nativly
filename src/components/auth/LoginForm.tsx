"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "@/components/auth/PasswordField";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/onboarding";
  const authError = searchParams.get("error");
  const authErrorReason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(() => {
    if (!authError) return null;
    if (authErrorReason) return authErrorReason;
    return "Connexion annulee ou echouee. Reessayez.";
  });
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);

  const supabase = createClient();

  function showFeedback(text: string, success = false) {
    setMessage(text);
    setMessageIsSuccess(success);
  }

  async function handleEmailAuth(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setMessageIsSuccess(false);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        showFeedback("Verifiez votre email pour confirmer votre compte.", true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      showFeedback("Entrez votre email pour recevoir le lien de reinitialisation.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setMessageIsSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
      });
      if (error) throw error;
      showFeedback(
        "Email de reinitialisation envoye. Verifiez votre boite mail.",
        true,
      );
    } catch (err) {
      showFeedback(
        err instanceof Error ? err.message : "Impossible d'envoyer l'email",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      showFeedback(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <Image
          src="/logo96.png"
          alt="Nativly"
          width={72}
          height={72}
          className="mx-auto mb-4 rounded-2xl"
        />
        <h1 className="font-display text-3xl text-zinc-100">
          {mode === "login" ? "Bon retour" : "Creer un compte"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Vos paroles et votre progression restent privees.
        </p>
      </div>

      <form
        onSubmit={handleEmailAuth}
        className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.03] p-6"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs text-zinc-500">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-amber-500/40"
          />
        </label>

        <div>
          <PasswordField
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />
          {mode === "login" && (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-xs text-amber-400/90 hover:text-amber-300 disabled:opacity-50"
              >
                Mot de passe oublie ?
              </button>
            </div>
          )}
        </div>

        {message && (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              messageIsSuccess
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {loading
            ? "Chargement..."
            : mode === "login"
              ? "Se connecter"
              : "S'inscrire"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "login" ? "signup" : "login"));
            setMessage(null);
            setMessageIsSuccess(false);
          }}
          className="w-full text-sm text-zinc-500 hover:text-zinc-300"
        >
          {mode === "login"
            ? "Pas encore de compte ? S'inscrire"
            : "Deja un compte ? Se connecter"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-zinc-600">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 py-3 text-sm text-zinc-200 hover:bg-white/10 disabled:opacity-50"
      >
        Continuer avec Google
      </button>

      <p className="mt-6 text-center text-xs text-zinc-600">
        <Link href="/" className="hover:text-zinc-400">
          Retour a l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
