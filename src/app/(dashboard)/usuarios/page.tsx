import UsersManagementWorkspace from "@/components/erp/UsersManagementWorkspace";
import { assertUserHasRole, requireAuthenticatedContext } from "@/lib/services/auth-service";
import { listTenantUsers, listTenantUsersWithAdminClient } from "@/lib/repositories/profile-repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { user, supabase } = await requireAuthenticatedContext();
  assertUserHasRole(user, ["admin"]);

  const users = hasSupabaseAdminConfigured()
    ? await listTenantUsersWithAdminClient(createSupabaseAdminClient(), user.tenantId)
    : await listTenantUsers(supabase, user.tenantId);

  return <UsersManagementWorkspace users={users} />;
}
