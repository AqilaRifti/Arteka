// server/api/messages/conversations/create.post.ts
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
  const { participantId, listingId } = body;

  if (!participantId) {
    throw createError({
      statusCode: 400,
      message: "Participant ID required",
    });
  }

  try {
    const supabase = getSupabaseClient();

    // Get current user
    const { data: user } = await supabase
      .from("users")
      .select("id, wallet_address")
      .eq("clerk_id", auth.userId)
      .single();

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "User not found",
      });
    }

    // Get participant
    const { data: participant } = await supabase
      .from("users")
      .select("id, wallet_address")
      .eq("id", participantId)
      .single();

    if (!participant) {
      throw createError({
        statusCode: 404,
        message: "Participant not found",
      });
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(participant1_id.eq.${user.id},participant2_id.eq.${participantId}),and(participant1_id.eq.${participantId},participant2_id.eq.${user.id})`
      )
      .single();

    if (existingConv) {
      return {
        success: true,
        conversation: existingConv,
        existed: true,
      };
    }

    // Create conversation on blockchain
    if (!participant.wallet_address) {
      throw createError({
        statusCode: 400,
        message: "Participant has no wallet address",
      });
    }

    const contract = getMessagingContract();
    const tx = await contract.createConversation(
      participant.wallet_address,
      listingId || 0
    );

    await tx.wait();

    // Get conversation ID from blockchain
    const conversationId = await contract.findConversation(
      participant.wallet_address
    );
    const blockchainId = Number(conversationId);

    // Store in database
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        blockchain_id: blockchainId,
        participant1_id: user.id,
        participant2_id: participantId,
        listing_id: listingId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return {
      success: true,
      conversation,
      existed: false,
    };
  } catch (error: any) {
    console.error("Conversation creation error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create conversation",
    });
  }
});
