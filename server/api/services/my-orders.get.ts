// server/api/services/orders/my-orders.get.ts
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const { userId } = getAuth(event);
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const query = getQuery(event);
  const { type } = query; // 'buying' or 'selling'

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    let dbQuery = supabase
      .from("service_orders")
      .select("*, service_listings(*)")
      .order("created_at", { ascending: false });

    if (type === "buying") {
      dbQuery = dbQuery.eq("buyer_clerk_id", userId);
    } else if (type === "selling") {
      dbQuery = dbQuery.eq("seller_clerk_id", userId);
    } else {
      dbQuery = dbQuery.or(
        `buyer_clerk_id.eq.${userId},seller_clerk_id.eq.${userId}`
      );
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    return { orders: data || [] };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message });
  }
});
