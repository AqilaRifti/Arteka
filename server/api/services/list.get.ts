// server/api/services/list.get.ts
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { category, seller, search } = query;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    let dbQuery = supabase
      .from("service_listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (category) dbQuery = dbQuery.eq("category", category);
    if (seller) dbQuery = dbQuery.eq("clerk_user_id", seller);
    if (search) dbQuery = dbQuery.ilike("title", `%${search}%`);

    const { data, error } = await dbQuery;

    if (error) throw error;

    return { services: data || [], count: data?.length || 0 };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message });
  }
});
