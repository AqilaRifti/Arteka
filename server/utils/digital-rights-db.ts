// ==========================================
// server/utils/digital-rights-db.ts
// ==========================================

export async function createDigitalWork(work: {
  work_id: number;
  creator_id: string;
  creator_wallet: string;
  title: string;
  description: string;
  work_type: string;
  ipfs_hash: string;
  metadata_hash: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  original_language: string;
  transaction_hash: string;
  block_number?: number;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("digital_works")
    .insert(work)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDigitalWorks(filters?: {
  workType?: string;
  creator?: string;
  search?: string;
}) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("digital_works")
    .select(
      `
      *,
      creator:users!digital_works_creator_id_fkey(id, email, wallet_address)
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (filters?.workType) {
    query = query.eq("work_type", filters.workType);
  }

  if (filters?.creator) {
    query = query.eq("creator_wallet", filters.creator);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getDigitalWorkById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("digital_works")
    .select(
      `
      *,
      creator:users!digital_works_creator_id_fkey(id, email, wallet_address)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getCreatorDigitalWorks(creatorId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("digital_works")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function deactivateDigitalWork(id: string, creatorId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("digital_works")
    .update({ is_active: false })
    .eq("id", id)
    .eq("creator_id", creatorId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDigitalRightsStats() {
  const supabase = getSupabaseClient();

  // Total works
  const { count: totalWorks } = await supabase
    .from("digital_works")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Works by type
  const { data: worksByType } = await supabase
    .from("digital_works")
    .select("work_type")
    .eq("is_active", true);

  const typeStats =
    worksByType?.reduce((acc: any, work) => {
      acc[work.work_type] = (acc[work.work_type] || 0) + 1;
      return acc;
    }, {}) || {};

  // Total creators
  const { data: creators } = await supabase
    .from("digital_works")
    .select("creator_wallet")
    .eq("is_active", true);

  const uniqueCreators = new Set(creators?.map((c) => c.creator_wallet) || []);

  // Recent works
  const { data: recentWorks } = await supabase
    .from("digital_works")
    .select(
      `
      *,
      creator:users!digital_works_creator_id_fkey(id, email, wallet_address)
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    totalWorks: totalWorks || 0,
    totalCreators: uniqueCreators.size,
    worksByType: typeStats,
    recentWorks: recentWorks || [],
  };
}

export async function searchDigitalWorks(searchQuery: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("digital_works")
    .select(
      `
      *,
      creator:users!digital_works_creator_id_fkey(id, email, wallet_address)
    `
    )
    .eq("is_active", true)
    .or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,work_type.ilike.%${searchQuery}%`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWorksByLanguage(language: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("digital_works")
    .select(
      `
      *,
      creator:users!digital_works_creator_id_fkey(id, email, wallet_address)
    `
    )
    .eq("is_active", true)
    .eq("original_language", language)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
