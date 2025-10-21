
// server/api/digital-rights/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const workType = query.workType as string | undefined
  const creator = query.creator as string | undefined
  const search = query.search as string | undefined
  
  try {
    const works = await getDigitalWorks({ workType, creator, search })
    return works
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})
