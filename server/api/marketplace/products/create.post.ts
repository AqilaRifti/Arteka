// server/api/marketplace/products/create.post.ts
import { getAuth } from "@clerk/nuxt/server";
import { ethers } from "ethers";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { workId, title, description, priceEth } = body;

  if (!workId || !title || !priceEth) {
    throw createError({
      statusCode: 400,
      message: "Work ID, title, and price are required",
    });
  }

  try {
    const supabase = getSupabaseClient();

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", auth.userId)
      .single();

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "User not found",
      });
    }

    // Convert ETH to Wei
    const priceWei = ethers.parseEther(priceEth.toString()).toString();

    // Create listing on blockchain
    const contract = getMarketplaceContract();
    const tx = await contract.createListing(
      workId,
      "product",
      title,
      description || "",
      priceWei
    );

    await tx.wait();

    // Get listing ID
    const listingCounter = await contract.listingCounter();
    const blockchainId = Number(listingCounter);

    // Store in Supabase
    const { data: listing, error } = await supabase
      .from("marketplace_listings")
      .insert({
        blockchain_id: blockchainId,
        work_id: workId,
        seller_id: user.id,
        listing_type: "product",
        title,
        description: description || "",
        price: priceEth,
        price_wei: priceWei,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return {
      success: true,
      listing,
    };
  } catch (error: any) {
    console.error("Product listing error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create product listing",
    });
  }
});
