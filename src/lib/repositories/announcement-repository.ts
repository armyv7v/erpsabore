import type { SupabaseClient } from "@supabase/supabase-js";
import type { HRAnnouncement } from "@/lib/types/erp";
import { mockHRNews } from "@/data/hrPortal";

// En memoria para el modo fallback sin Supabase
let localAnnouncements: HRAnnouncement[] = mockHRNews.map((n) => ({
  id: n.id,
  tenantId: "mock",
  title: n.title,
  category: n.category,
  categoryColor: n.categoryColor,
  imageUrl: n.imageUrl,
  content: "Este es un comunicado oficial de la empresa para informar sobre " + n.title.toLowerCase() + ".",
  createdAt: new Date(Date.now() - 3600000 * (n.id === "1" ? 2 : 24)).toISOString(),
}));

interface AnnouncementRow {
  id: string;
  tenant_id: string;
  title: string;
  category: string;
  category_color: string;
  image_url: string | null;
  content: string | null;
  created_by: string | null;
  created_at: string;
}

function mapAnnouncement(row: AnnouncementRow): HRAnnouncement {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    category: row.category,
    categoryColor: row.category_color,
    imageUrl: row.image_url,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

const SELECT_FIELDS = "id, tenant_id, title, category, category_color, image_url, content, created_by, created_at";

export async function listAnnouncements(
  supabase: SupabaseClient | null,
  tenantId: string
): Promise<HRAnnouncement[]> {
  if (!supabase) {
    return localAnnouncements;
  }

  const { data, error } = await supabase
    .from("hr_announcements")
    .select(SELECT_FIELDS)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error al listar comunicados: ${error.message}`);
  }

  return ((data ?? []) as AnnouncementRow[]).map(mapAnnouncement);
}

export async function createAnnouncement(
  supabase: SupabaseClient | null,
  tenantId: string,
  input: {
    title: string;
    category: string;
    categoryColor: string;
    imageUrl?: string | null;
    content?: string | null;
    createdBy?: string | null;
  }
): Promise<HRAnnouncement> {
  if (!supabase) {
    const newAnn: HRAnnouncement = {
      id: Math.random().toString(36).substring(7),
      tenantId,
      title: input.title,
      category: input.category,
      categoryColor: input.categoryColor,
      imageUrl: input.imageUrl,
      content: input.content,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    localAnnouncements = [newAnn, ...localAnnouncements];
    return newAnn;
  }

  const { data, error } = await supabase
    .from("hr_announcements")
    .insert({
      tenant_id: tenantId,
      title: input.title,
      category: input.category,
      category_color: input.categoryColor,
      image_url: input.imageUrl || null,
      content: input.content || null,
      created_by: input.createdBy || null,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(`Error al crear comunicado: ${error?.message || "Error desconocido"}`);
  }

  return mapAnnouncement(data as AnnouncementRow);
}

export async function deleteAnnouncement(
  supabase: SupabaseClient | null,
  tenantId: string,
  id: string
): Promise<void> {
  if (!supabase) {
    localAnnouncements = localAnnouncements.filter((a) => a.id !== id);
    return;
  }

  const { error } = await supabase
    .from("hr_announcements")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (error) {
    throw new Error(`Error al eliminar comunicado: ${error.message}`);
  }
}
