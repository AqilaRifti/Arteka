// server/api/listings/create.post.ts
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
  const {
    workId,
    listingType,
    category,
    title,
    description,
    price, // in ETH
    privateKey,
  } = body;

  if (!listingType || !title || !price || !privateKey) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  if (listingType !== "product" && listingType !== "service") {
    throw createError({
      statusCode: 400,
      message: "Invalid listing type",
    });
  }

  try {
    // Get user
    const user = await getUserByClerkId(auth.userId);

    if (!user || !user.wallet_address) {
      throw createError({
        statusCode: 400,
        message: "User wallet not configured",
      });
    }

    // Create listing on blockchain
    const result = await createListingOnChain(
      privateKey,
      workId || 0,
      listingType,
      title,
      description,
      price
    );

    if (!result.listingId) {
      throw createError({
        statusCode: 500,
        message: "Failed to create listing on blockchain",
      });
    }

    // Save to database
    const listing = await createListing({
      listing_id: result.listingId,
      work_id: workId,
      seller_id: user.id,
      seller_wallet: user.wallet_address,
      listing_type: listingType,
      category: listingType === "service" ? category : undefined,
      title,
      description,
      price: (parseFloat(price) * 1e18).toString(), // Convert to wei
      transaction_hash: result.transactionHash,
      block_number: result.blockNumber,
    });

    return listing;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
