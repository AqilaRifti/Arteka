// server/api/marketplace/my-listings.get.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const supabase = getSupabaseClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", auth.userId)
    .single();

  if (!user) {
    return [];
  }

  const { data: listings, error } = await supabase
    .from("marketplace_listings")
    .select(
      `
      *,
      work:digital_works!marketplace_listings_work_id_fkey (
        id,
        title,
        work_type,
        ipfs_hash
      )
    `
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to fetch listings",
    });
  }

  return listings;
});
