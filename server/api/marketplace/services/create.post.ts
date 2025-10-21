// server/api/marketplace/services/create.post.ts
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
  const { category, title, description, priceEth } = body;

  if (!category || !title || !priceEth) {
    throw createError({
      statusCode: 400,
      message: "Category, title, and price are required",
    });
  }

  try {
    const supabase = getSupabaseClient();

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

    const priceWei = ethers.parseEther(priceEth.toString()).toString();

    // Create listing on blockchain (workId = 0 for services)
    const contract = getMarketplaceContract();
    const tx = await contract.createListing(
      0, // No work ID for services
      "service",
      title,
      description || "",
      priceWei
    );

    await tx.wait();

    const listingCounter = await contract.listingCounter();
    const blockchainId = Number(listingCounter);

    const { data: listing, error } = await supabase
      .from("marketplace_listings")
      .insert({
        blockchain_id: blockchainId,
        seller_id: user.id,
        listing_type: "service",
        category,
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
    console.error("Service listing error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create service listing",
    });
  }
});
