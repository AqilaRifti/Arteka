// server/api/marketplace/products/index.get.ts
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
      ),
      work:digital_works!marketplace_listings_work_id_fkey (
        id,
        title,
        work_type,
        ipfs_hash
      )
    `
    )
    .eq("listing_type", "product")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (query.sellerId) {
    dbQuery = dbQuery.eq("seller_id", query.sellerId);
  }

  const { data: listings, error } = await dbQuery;

  if (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to fetch products",
    });
  }

  return listings;
});
