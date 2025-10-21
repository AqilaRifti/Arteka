// server/api/funding/back-campaign.post.ts
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
  const { campaignId, amount, privateKey } = body;

  if (!campaignId || !amount || !privateKey) {
    throw createError({
      statusCode: 400,
      message: "Campaign ID, amount, and private key are required",
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

    // Get campaign from database
    const campaign = await getCampaignById(campaignId);

    if (!campaign || !campaign.is_active) {
      throw createError({
        statusCode: 404,
        message: "Campaign not found or inactive",
      });
    }

    if (campaign.creator_wallet === user.wallet_address) {
      throw createError({
        statusCode: 400,
        message: "Cannot back your own campaign",
      });
    }

    // Fund on blockchain
    const result = await fundCampaignOnChain(
      privateKey,
      campaign.campaign_id,
      amount
    );

    // Save backer to database
    await addCampaignBacker({
      campaign_id: campaign.campaign_id,
      backer_id: user.id,
      backer_wallet: user.wallet_address,
      amount: (parseFloat(amount) * 1e18).toString(),
      transaction_hash: result.transactionHash,
    });

    // Check if goal reached
    const updatedCampaign = await getCampaignById(campaignId);
    const totalFunded = BigInt(updatedCampaign.total_funded);
    const fundingGoal = BigInt(updatedCampaign.funding_goal);

    if (totalFunded >= fundingGoal && !updatedCampaign.is_funded) {
      await updateCampaignFunded(campaign.campaign_id, true);
    }

    return {
      success: true,
      transactionHash: result.transactionHash,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
