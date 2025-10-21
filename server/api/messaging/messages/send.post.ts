// server/api/messaging/messages/send.post.ts
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
  const { conversationId, messageType, content, fileData } = body;

  if (!conversationId || !messageType) {
    throw createError({
      statusCode: 400,
      message: "conversationId and messageType are required",
    });
  }

  if (messageType === "text" && !content) {
    throw createError({
      statusCode: 400,
      message: "content is required for text messages",
    });
  }

  if ((messageType === "file" || messageType === "image") && !fileData) {
    throw createError({
      statusCode: 400,
      message: "fileData is required for file/image messages",
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

    const message = await sendMessage(
      conversationId,
      user.id,
      messageType,
      content,
      fileData
    );

    return message;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
