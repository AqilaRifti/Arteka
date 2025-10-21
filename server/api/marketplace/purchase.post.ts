// server/api/marketplace/purchase.post.ts
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
  const { listingId, transactionHash } = body;

  if (!listingId || !transactionHash) {
    throw createError({
      statusCode: 400,
      message: "Listing ID and transaction hash are required",
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

    // Get listing
    const { data: listing } = await supabase
      .from("listings")
      .select("*, seller:seller_id(id)")
      .eq("id", listingId)
      .single();

    if (!listing) {
      throw createError({
        statusCode: 404,
        message: "Listing not found",
      });
    }

    // Verify transaction on blockchain
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(transactionHash);

    if (!receipt || receipt.status !== 1) {
      throw createError({
        statusCode: 400,
        message: "Transaction failed or not found",
      });
    }

    // Get purchase counter from blockchain
    const contract = getMarketplaceContract();
    const purchaseCounter = await contract.purchaseCounter();
    const blockchainId = Number(purchaseCounter);

    // Store purchase
    const { data: purchase, error } = await supabase
      .from("purchases")
      .insert({
        blockchain_id: blockchainId,
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller.id,
        price: listing.price,
        transaction_hash: transactionHash,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Update sold count
    await supabase
      .from("marketplace_listings")
      .update({ sold_count: listing.sold_count + 1 })
      .eq("id", listingId);

    return {
      success: true,
      purchase,
    };
  } catch (error: any) {
    console.error("Purchase error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to record purchase",
    });
  }
});
