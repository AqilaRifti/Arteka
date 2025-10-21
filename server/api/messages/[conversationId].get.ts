// server/api/messages/[conversationId].get.ts
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
      message: "Conversation ID required",
    });
  }

  const supabase = getSupabaseClient();

  // Get user
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", auth.userId)
    .single();

  if (!user) {
    throw createError({
      statusCode: 404,
      message: "User not found",
    });
  }

  // Verify user is participant
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    throw createError({
      statusCode: 404,
      message: "Conversation not found",
    });
  }

  if (
    conversation.participant1_id !== user.id &&
    conversation.participant2_id !== user.id
  ) {
    throw createError({
      statusCode: 403,
      message: "Not a participant",
    });
  }

  // Get messages
  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:sender_id(id, username, email)
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to fetch messages",
    });
  }

  // Decrypt messages for this user
  const decryptedMessages = messages.map((msg) => {
    try {
      const decrypted = decryptMessage(
        msg.encrypted_content,
        msg.message_key,
        Buffer.from(msg.encrypted_key, "base64").toString("hex")
      );

      return {
        ...msg,
        decryptedContent: decrypted,
      };
    } catch (error) {
      console.error("Decryption error:", error);
      return {
        ...msg,
        decryptedContent: "[Decryption failed]",
      };
    }
  });

  return decryptedMessages;
});
