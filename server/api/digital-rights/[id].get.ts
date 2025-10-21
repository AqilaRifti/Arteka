// server/api/digital-rights/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Work ID is required",
    });
  }

  try {
    const work = await getDigitalWorkById(id);

    if (!work) {
      throw createError({
        statusCode: 404,
        message: "Work not found",
      });
    }

    // Add IPFS URLs
    return {
      ...work,
      ipfsUrl: `https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${work.ipfs_hash}`,
      metadataUrl: `https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${work.metadata_hash}`,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
