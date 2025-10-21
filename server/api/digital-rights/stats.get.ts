// server/api/digital-rights/stats.get.ts
export default defineEventHandler(async (event) => {
  try {
    const stats = await getDigitalRightsStats();
    return stats;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
