// server/api/messaging/conversations/index.get.ts
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

    if (!user || !user.wallet_address) {
      throw createError({
        statusCode: 400,
        message: "User wallet not configured",
      });
    }

    const conversations = await getUserConversations(user.wallet_address);
    return conversations;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
