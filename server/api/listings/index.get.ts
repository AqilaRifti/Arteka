// server/api/listings/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = query.type as 'product' | 'service' | undefined
  const category = query.category as string | undefined
  
  try {
    const listings = await getActiveListings(type, category)
    return listings
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})