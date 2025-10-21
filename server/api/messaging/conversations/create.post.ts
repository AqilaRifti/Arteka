// server/api/messaging/conversations/create.post.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { participant2Id, listingId } = body;

  if (!participant2Id) {
    throw createError({
      statusCode: 400,
      message: "participant2Id is required",
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

    if (user.id === participant2Id) {
      throw createError({
        statusCode: 400,
        message: "Cannot create conversation with yourself",
      });
    }

    const conversation = await findOrCreateConversation(
      user.id,
      participant2Id,
      listingId
    );

    return conversation;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
