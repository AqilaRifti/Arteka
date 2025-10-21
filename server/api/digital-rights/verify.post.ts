// server/api/digital-rights/verify.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { workId, creatorWallet } = body;

  if (!workId || !creatorWallet) {
    throw createError({
      statusCode: 400,
      message: "Work ID and creator wallet are required",
    });
  }

  try {
    const isValid = await verifyWorkOwnershipOnChain(workId, creatorWallet);

    return {
      valid: isValid,
      workId,
      creator: creatorWallet,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
