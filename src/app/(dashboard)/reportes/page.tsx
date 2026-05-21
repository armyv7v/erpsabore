import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { getBIBaseMetrics } from "@/lib/services/bi-service";
import BIClient from "./bi-client";

export default async function BIDashboardPage() {
  const user = await requireAuthenticatedUser();
  const biBase = await getBIBaseMetrics(user);

  return <BIClient biBase={biBase} />;
}
