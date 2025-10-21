// server/api/messages/unlock.post.ts
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
  const { messageId } = body;

  if (!messageId) {
    throw createError({
      statusCode: 400,
      message: "Message ID required",
    });
  }

  try {
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

    // Get message
    const { data: message } = await supabase
      .from("messages")
      .select(
        `
        *,
        conversation:conversations(*)
      `
      )
      .eq("id", messageId)
      .single();

    if (!message) {
      throw createError({
        statusCode: 404,
        message: "Message not found",
      });
    }

    // Verify user is participant
    if (
      message.conversation.participant1_id !== user.id &&
      message.conversation.participant2_id !== user.id
    ) {
      throw createError({
        statusCode: 403,
        message: "Not authorized",
      });
    }

    if (message.is_unlocked) {
      throw createError({
        statusCode: 400,
        message: "Message already unlocked",
      });
    }

    // Unlock on blockchain
    const contract = getMessagingContract();
    const tx = await contract.unlockMessageForEvidence(
      message.blockchain_id,
      message.message_key
    );

    await tx.wait();

    // Update database
    const { data: updated, error } = await supabase
      .from("messages")
      .update({
        is_unlocked: true,
        unlocked_by: user.id,
        decryption_key: message.message_key,
        unlocked_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return {
      success: true,
      message: updated,
      decryptionKey: message.message_key,
    };
  } catch (error: any) {
    console.error("Unlock error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to unlock message",
    });
  }
});
