import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/config/env.public";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/onboarding";
  }
  return next;
}

function buildRedirectUrl(
  request: NextRequest,
  origin: string,
  path: string,
): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return `${origin}${path}`;
  }
  if (forwardedHost) {
    return `https://${forwardedHost}${path}`;
  }
  return `${origin}${path}`;
}

function loginErrorRedirect(
  request: NextRequest,
  origin: string,
  reason?: string,
): NextResponse {
  const url = new URL(buildRedirectUrl(request, origin, "/auth/login"));
  url.searchParams.set("error", "auth_callback");
  if (reason) {
    url.searchParams.set("reason", reason);
  }
  return NextResponse.redirect(url.toString());
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    return loginErrorRedirect(request, origin, oauthError);
  }

  if (!code) {
    return loginErrorRedirect(
      request,
      origin,
      "Code d'autorisation manquant.",
    );
  }

  const redirectTo = buildRedirectUrl(request, origin, next);
  let response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return loginErrorRedirect(request, origin, error.message);
  }

  return response;
}
