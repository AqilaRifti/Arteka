// server/utils/messaging-db.ts
import { createClient } from "@supabase/supabase-js";

export async function findOrCreateConversation(
  participant1Id: string,
  participant2Id: string,
  listingId?: string
) {
  const supabase = getSupabaseClient();

  // Try to find existing conversation (check both directions)
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `and(participant1_id.eq.${participant1Id},participant2_id.eq.${participant2Id}),and(participant1_id.eq.${participant2Id},participant2_id.eq.${participant1Id})`
    )
    .maybeSingle();

  if (existing) return existing;

  // Create new conversation
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      participant1_id: participant1Id,
      participant2_id: participant2Id,
      listing_id: listingId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserConversationsList(userId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      participant1:users!conversations_participant1_id_fkey(id, email, wallet_address),
      participant2:users!conversations_participant2_id_fkey(id, email, wallet_address),
      listing:listings(id, title, listing_type, price),
      last_message:messages(content, message_type, created_at)
    `
    )
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error) throw error;

  // Get unread count for each conversation
  const conversationsWithUnread = await Promise.all(
    (data || []).map(async (conv) => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("is_read", false)
        .neq("sender_id", userId);

      return {
        ...conv,
        unread_count: count || 0,
      };
    })
  );

  return conversationsWithUnread;
}

export async function getConversationWithMessages(
  conversationId: string,
  userId: string
) {
  const supabase = getSupabaseClient();

  // Get conversation details
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select(
      `
      *,
      participant1:users!conversations_participant1_id_fkey(id, email, wallet_address),
      participant2:users!conversations_participant2_id_fkey(id, email, wallet_address),
      listing:listings(id, title, listing_type, price, seller_id)
    `
    )
    .eq("id", conversationId)
    .single();

  if (convError) throw convError;

  // Verify user is a participant
  if (
    conversation.participant1_id !== userId &&
    conversation.participant2_id !== userId
  ) {
    throw new Error("Not authorized to view this conversation");
  }

  // Get messages
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey(id, email, wallet_address)
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) throw msgError;

  return {
    conversation,
    messages: messages || [],
  };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  messageType: "text" | "file" | "image",
  content?: string,
  fileData?: {
    url: string;
    name: string;
    size: number;
    type: string;
  }
) {
  const supabase = getSupabaseClient();

  const messageData: any = {
    conversation_id: conversationId,
    sender_id: senderId,
    message_type: messageType,
  };

  if (messageType === "text") {
    messageData.content = content;
  } else {
    messageData.file_url = fileData?.url;
    messageData.file_name = fileData?.name;
    messageData.file_size = fileData?.size;
    messageData.file_type = fileData?.type;
    messageData.content = content || fileData?.name; // Optional caption
  }

  const { data, error } = await supabase
    .from("messages")
    .insert(messageData)
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey(id, email, wallet_address)
    `
    )
    .single();

  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string
) {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

export async function getUnreadMessageCount(userId: string) {
  const supabase = getSupabaseClient();

  // Get all conversations for user
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

  if (!conversations) return 0;

  const conversationIds = conversations.map((c) => c.id);

  // Count unread messages
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .eq("is_read", false)
    .neq("sender_id", userId);

  return count || 0;
}
