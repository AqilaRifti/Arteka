// server/api/funding/my-earnings.get.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  try {
    const user = await getUserByClerkId(auth.userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "User not found",
      });
    }

    const distributions = await getBackerDistributions(user.id);
    return distributions;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
