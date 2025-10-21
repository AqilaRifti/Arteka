// server/api/messaging/conversations/[id].get.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const conversationId = getRouterParam(event, "id");

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      message: "Conversation ID is required",
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

    const data = await getConversationWithMessages(conversationId, user.id);

    // Mark messages as read
    await markMessagesAsRead(conversationId, user.id);

    return data;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
