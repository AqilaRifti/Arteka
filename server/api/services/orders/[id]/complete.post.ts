// server/api/services/orders/[id]/complete.post.ts
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const { userId } = getAuth(event);
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const orderId = getRouterParam(event, "id");
  const body = await readBody(event);
  const { rating, review } = body;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Verify buyer
    const { data: order } = await supabase
      .from("service_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) throw new Error("Order not found");
    if (order.buyer_clerk_id !== userId) throw new Error("Not authorized");

    // Update order
    await supabase
      .from("service_orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // Create review
    if (rating) {
      await supabase.from("service_reviews").insert({
        service_id: order.listing_id,
        order_id: orderId,
        reviewer_clerk_id: userId,
        seller_clerk_id: order.seller_clerk_id,
        rating,
        review: review || "",
      });
    }

    return { success: true };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message });
  }
});
