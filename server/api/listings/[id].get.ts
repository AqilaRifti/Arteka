// server/api/listings/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Listing ID is required",
    });
  }

  try {
    const listing = await getListingById(id);
    return listing;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
