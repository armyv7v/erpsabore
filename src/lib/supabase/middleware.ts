import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { canAccessPath } from "@/lib/access-control";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();
  const supabaseCookieNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-"));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          request.cookies.set(cookie.name, cookie.value);
        }

        response = NextResponse.next({ request });

        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && request.nextUrl.pathname !== "/acceso-denegado") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role;
    const status = profile?.status;

    if (status === "inactive") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/acceso-denegado";
      redirectUrl.searchParams.set("from", "usuario inactivo");
      return NextResponse.redirect(redirectUrl);
    }

    if (role && !canAccessPath(role, request.nextUrl.pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/acceso-denegado";
      redirectUrl.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }



  return response;
}
