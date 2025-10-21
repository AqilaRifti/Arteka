// server/api/messaging/conversations/list.get.ts
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

    const conversations = await getUserConversationsList(user.id);
    return conversations;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
