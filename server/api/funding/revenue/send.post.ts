// server/api/funding/revenue/send.post.ts
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
  const { campaignId, amount, source, privateKey } = body;

  if (!campaignId || !amount || !source || !privateKey) {
    throw createError({
      statusCode: 400,
      message: "All fields are required",
    });
  }

  try {
    const user = await getUserByClerkId(auth.userId);

    if (!user || !user.wallet_address) {
      throw createError({
        statusCode: 400,
        message: "User wallet not configured",
      });
    }

    // Get campaign
    const campaign = await getCampaignById(campaignId);

    if (!campaign || !campaign.is_funded) {
      throw createError({
        statusCode: 400,
        message: "Campaign not found or not funded yet",
      });
    }

    // Send revenue to blockchain (automatically distributes)
    const result = await sendRevenueToChain(
      privateKey,
      campaign.campaign_id,
      amount,
      source
    );

    if (!result.paymentId) {
      throw createError({
        statusCode: 500,
        message: "Failed to send revenue",
      });
    }

    // Save revenue payment
    await createRevenuePayment({
      payment_id: result.paymentId,
      campaign_id: campaign.campaign_id,
      payer_wallet: user.wallet_address,
      amount: (parseFloat(amount) * 1e18).toString(),
      source,
      transaction_hash: result.transactionHash,
      block_number: result.blockNumber,
    });

    // Update campaign stats
    const newRevenue =
      BigInt(campaign.total_revenue) +
      BigInt((parseFloat(amount) * 1e18).toString());
    await updateCampaignStats(campaign.campaign_id, {
      total_revenue: newRevenue.toString(),
    });

    return {
      success: true,
      transactionHash: result.transactionHash,
      message:
        "Revenue sent and automatically distributed to creator and backers",
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
