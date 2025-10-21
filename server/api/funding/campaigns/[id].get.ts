// server/api/funding/campaigns/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Campaign ID is required",
    });
  }

  try {
    const campaign = await getCampaignById(id);
    return campaign;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
