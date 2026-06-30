import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/config/env.public";

const PROTECTED_PREFIXES = ["/music", "/dashboard", "/onboarding"];
const AUTH_PATHS = ["/auth/login", "/auth/callback", "/auth/reset-password"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPath && pathname === "/auth/login") {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = "/onboarding";
    nextUrl.search = "";
    return NextResponse.redirect(nextUrl);
  }

  if (user && isProtected && !pathname.startsWith("/onboarding")) {
    const { data: profile } = await supabase
      .from("user_profile")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      onboardingUrl.search = "";
      return NextResponse.redirect(onboardingUrl);
    }
  }

  if (user && pathname.startsWith("/onboarding")) {
    const recalibrate =
      request.nextUrl.searchParams.get("recalibrate") === "1";

    const { data: profile } = await supabase
      .from("user_profile")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();

    if (profile?.onboarding_completed && !recalibrate) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/music/lyrics";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}
