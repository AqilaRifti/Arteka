// server/api/marketplace/listings.get.ts
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { type, seller, workId } = query;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    let dbQuery = supabase
      .from("marketplace_listings")
      .select("*, digital_works(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (type) dbQuery = dbQuery.eq("listing_type", type);
    if (seller) dbQuery = dbQuery.eq("clerk_user_id", seller);
    if (workId) dbQuery = dbQuery.eq("work_id", workId);

    const { data, error } = await dbQuery;

    if (error) throw error;

    return { listings: data || [], count: data?.length || 0 };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message });
  }
});
