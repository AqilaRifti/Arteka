// server/api/messaging/messages/[conversationId].get.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const conversationId = getRouterParam(event, "conversationId");

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      message: "Conversation ID is required",
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

    const messages = await getConversationMessages(
      parseInt(conversationId),
      user.wallet_address
    );

    return messages;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
