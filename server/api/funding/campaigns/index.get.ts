// server/api/funding/campaigns/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const projectType = query.projectType as string | undefined;

  try {
    const campaigns = await getActiveCampaigns(projectType);
    return campaigns;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
