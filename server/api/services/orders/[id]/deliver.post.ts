// server/api/services/orders/[id]/deliver.post.ts
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";
import pinataSDK from "@pinata/sdk";

export default defineEventHandler(async (event) => {
  const { userId } = getAuth(event);
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const orderId = getRouterParam(event, "id");
  const formData = await readMultipartFormData(event);

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Verify seller
    const { data: order } = await supabase
      .from("service_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) throw new Error("Order not found");
    if (order.seller_clerk_id !== userId) throw new Error("Not authorized");

    let deliveryFiles: any[] = [];
    let deliveryNotes = "";

    // Process uploaded files
    if (formData) {
      const pinata = new pinataSDK(
        process.env.PINATA_API_KEY!,
        process.env.PINATA_SECRET_KEY!
      );

      for (const part of formData) {
        if (part.name === "files") {
          const fileBuffer = Buffer.from(part.data);
          const result = await pinata.pinFileToIPFS(fileBuffer, {
            pinataMetadata: { name: part.filename || "delivery" },
          });

          deliveryFiles.push({
            filename: part.filename,
            ipfsHash: result.IpfsHash,
            size: part.data.length,
            type: part.type,
          });
        } else if (part.name === "notes") {
          deliveryNotes = part.data.toString();
        }
      }
    }

    // Update order
    const { data: updatedOrder } = await supabase
      .from("service_orders")
      .update({
        status: "delivered",
        delivery_files: deliveryFiles,
        delivery_notes: deliveryNotes,
        delivered_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    return {
      success: true,
      order: updatedOrder,
      deliveryFiles,
    };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message });
  }
});
