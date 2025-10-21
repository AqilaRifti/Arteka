// server/api/services/[id].get.ts
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const serviceId = getRouterParam(event, "id");

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: service, error } = await supabase
      .from("service_listings")
      .select("*, service_orders(count)")
      .eq("listing_id", serviceId)
      .single();

    if (error) throw error;

    // Get seller reviews/ratings
    const { data: reviews } = await supabase
      .from("service_reviews")
      .select("*")
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false });

    return { service, reviews: reviews || [] };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message });
  }
});
