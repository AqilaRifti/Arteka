// server/api/messages/conversations/index.get.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const supabase = getSupabaseClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", auth.userId)
    .single();

  if (!user) {
    return [];
  }

  // Get all conversations where user is a participant
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      participant1:participant1_id(id, username, email),
      participant2:participant2_id(id, username, email),
      listing:marketplace_listings(id, title, listing_type),
      messages(id, created_at)
    `
    )
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to fetch conversations",
    });
  }

  // Add the other participant info and last message
  return conversations.map((conv) => {
    const otherParticipant =
      conv.participant1.id === user.id ? conv.participant2 : conv.participant1;

    const lastMessage =
      conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

    return {
      ...conv,
      otherParticipant,
      lastMessage,
    };
  });
});
