import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const roleParam = searchParams.get("role");
      if (roleParam === "cliente") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Buscamos si ya tiene perfil
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (!profile) {
            // Buscamos el primer tenant
            const { data: tenant } = await supabase
              .from("tenants")
              .select("id")
              .order("created_at", { ascending: true })
              .limit(1)
              .single();

            if (tenant) {
              const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Cliente Google";
              const rutTemp = `G-${user.id.slice(0, 8)}`;
              let customerId: string | null = null;
              
              const { data: existingCustomer } = await supabase
                .from("customers")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("email", user.email || "")
                .maybeSingle();
                
              if (existingCustomer) {
                customerId = existingCustomer.id;
              } else {
                const { data: newCustomer } = await supabase
                  .from("customers")
                  .insert({
                    tenant_id: tenant.id,
                    name: fullName,
                    rut: rutTemp,
                    email: user.email,
                  })
                  .select("id")
                  .single();
                  
                if (newCustomer) {
                  customerId = newCustomer.id;
                }
              }

              // Insertamos el perfil con rol 'cliente'
              await supabase
                .from("profiles")
                .insert({
                  id: user.id,
                  tenant_id: tenant.id,
                  email: user.email || "",
                  full_name: fullName,
                  role: "cliente",
                  customer_id: customerId,
                  status: "active",
                });
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}