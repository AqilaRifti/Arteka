// server/api/marketplace/my-purchases.get.ts
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

  const { data: purchases, error } = await supabase
    .from("purchases")
    .select(
      `
      *,
      listing:marketplace_listings(
        *,
        seller:seller_id(username, email),
        work:digital_works!marketplace_listings_work_id_fkey(title, work_type, ipfs_hash)
      )
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to fetch purchases",
    });
  }

  return purchases;
});
