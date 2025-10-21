// server/api/marketplace/services/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const supabase = getSupabaseClient();

  let dbQuery = supabase
    .from("marketplace_listings")
    .select(
      `
      *,
      seller:seller_id (
        id,
        username,
        email
      )
    `
    )
    .eq("listing_type", "service")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (query.category) {
    dbQuery = dbQuery.eq("category", query.category);
  }

  if (query.sellerId) {
    dbQuery = dbQuery.eq("seller_id", query.sellerId);
  }

  const { data: listings, error } = await dbQuery;

  if (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to fetch services",
    });
  }

  return listings;
});
