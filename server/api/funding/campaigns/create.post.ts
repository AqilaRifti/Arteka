// server/api/funding/campaigns/create.post.ts
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
    title,
    description,
    projectType,
    fundingGoal, // in ETH
    creatorSharePercent, // 0-100
    durationInDays,
    privateKey,
  } = body;

  if (
    !title ||
    !projectType ||
    !fundingGoal ||
    !creatorSharePercent ||
    !durationInDays ||
    !privateKey
  ) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
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

    // Create campaign on blockchain
    const result = await createCampaignOnChain(
      privateKey,
      title,
      description,
      projectType,
      fundingGoal,
      creatorSharePercent,
      durationInDays
    );

    if (!result.campaignId) {
      throw createError({
        statusCode: 500,
        message: "Failed to create campaign on blockchain",
      });
    }

    // Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + durationInDays);

    // Save to database
    const campaign = await createFundingCampaign({
      campaign_id: result.campaignId,
      creator_id: user.id,
      creator_wallet: user.wallet_address,
      title,
      description,
      project_type: projectType,
      funding_goal: (parseFloat(fundingGoal) * 1e18).toString(),
      creator_share: creatorSharePercent * 100, // Convert to basis points
      backers_share: (100 - creatorSharePercent) * 100,
      deadline: deadline.toISOString(),
      transaction_hash: result.transactionHash,
      block_number: result.blockNumber,
    });

    return campaign;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
