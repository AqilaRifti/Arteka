// server/api/purchases/create.post.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { listingId, privateKey } = body;

  if (!listingId || !privateKey) {
    throw createError({
      statusCode: 400,
      message: "Listing ID and private key are required",
    });
  }

  try {
    // Get buyer user
    const user = await getUserByClerkId(auth.userId);

    if (!user || !user.wallet_address) {
      throw createError({
        statusCode: 400,
        message: "User wallet not configured",
      });
    }

    // Get listing from database
    const listing = await getListingById(listingId);

    if (!listing || !listing.is_active) {
      throw createError({
        statusCode: 404,
        message: "Listing not found or inactive",
      });
    }

    if (listing.seller_wallet === user.wallet_address) {
      throw createError({
        statusCode: 400,
        message: "Cannot purchase your own listing",
      });
    }

    // Purchase on blockchain
    const result = await purchaseListingOnChain(
      privateKey,
      listing.listing_id,
      listing.price
    );

    if (!result.purchaseId) {
      throw createError({
        statusCode: 500,
        message: "Failed to purchase on blockchain",
      });
    }

    // Save purchase to database
    const purchase = await createPurchase({
      purchase_id: result.purchaseId,
      listing_id: listing.listing_id,
      buyer_id: user.id,
      buyer_wallet: user.wallet_address,
      seller_wallet: listing.seller_wallet,
      price: listing.price,
      transaction_hash: result.transactionHash,
      block_number: result.blockNumber,
    });

    // Update sold count
    await updateListingSoldCount(listing.listing_id);

    return {
      success: true,
      purchase,
      transactionHash: result.transactionHash,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
