// server/utils/db.ts
import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const config = useRuntimeConfig();
  return createClient(config.supabaseUrl, config.supabaseServiceKey);
}

export async function getUserByClerkId(clerkId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createUser(
  clerkId: string,
  email: string,
  walletAddress?: string,
  encryptedPrivateKey?: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .insert({
      clerk_id: clerkId,
      email,
      wallet_address: walletAddress,
      encrypted_private_key: encryptedPrivateKey,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserWallet(
  userId: string,
  walletAddress: string,
  encryptedPrivateKey: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      wallet_address: walletAddress,
      encrypted_private_key: encryptedPrivateKey,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createListing(listing: {
  listing_id: number;
  work_id?: number;
  seller_id: string;
  seller_wallet: string;
  listing_type: "product" | "service";
  category?: string;
  title: string;
  description: string;
  price: string;
  transaction_hash: string;
  block_number?: number;
}) {
    console.log("check 1")
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .insert(listing)
    .select()
    .single();
    console.log("check 2")

  if (error) {console.log("check error");console.log(error);throw error;};
  console.log(data)
  return data;
}

export async function getActiveListings(
  listingType?: "product" | "service",
  category?: string
) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (listingType) {
    query = query.eq("listing_type", listingType);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getListingById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("listing_id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getSellerListings(sellerId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function deactivateListing(id: string, sellerId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ is_active: false })
    .eq("id", id)
    .eq("seller_id", sellerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createPurchase(purchase: {
  purchase_id: number;
  listing_id: number;
  buyer_id: string;
  buyer_wallet: string;
  seller_wallet: string;
  price: string;
  transaction_hash: string;
  block_number?: number;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("purchases")
    .insert(purchase)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateListingSoldCount(listingId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("increment_sold_count", {
    listing_id: listingId,
  });

  if (error) throw error;
  return data;
}

export async function getBuyerPurchases(buyerId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(
      `
      *,
      listing:listings(*)
    `
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createConversation(conversation: {
  conversation_id: number;
  participant1_wallet: string;
  participant2_wallet: string;
  listing_id?: number;
  transaction_hash: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert(conversation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createMessage(message: {
  message_id: number;
  conversation_id: number;
  sender_wallet: string;
  encrypted_content: string;
  encrypted_key: string;
  transaction_hash: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getConversationMessages(
  conversationId: number,
  walletAddress: string
) {
  const supabase = getSupabaseClient();

  // First verify user is participant
  const { data: conv } = await supabase
    .from("conversations")
    .select("*")
    .eq("conversation_id", conversationId)
    .or(
      `participant1_wallet.eq.${walletAddress},participant2_wallet.eq.${walletAddress}`
    )
    .single();

  if (!conv) throw new Error("Not authorized to view this conversation");

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getUserConversations(walletAddress: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `participant1_wallet.eq.${walletAddress},participant2_wallet.eq.${walletAddress}`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
