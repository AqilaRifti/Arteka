// server/api/messaging/unlock.post.ts
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";
import { ethers } from "ethers";

const MESSAGING_CONTRACT_ADDRESS =
  process.env.MESSAGING_CONTRACT_ADDRESS ||
  "0xc67002474b9328aB96918190e1b79D7ed8d0B3a8";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const MESSAGING_ABI = [
  "function unlockMessageForEvidence(uint256 _messageId, string memory _decryptionKey) public",
  // If contract emits an event for unlocking, list it here (optional)
  // 'event MessageUnlocked(uint256 indexed messageId, address indexed unlockedBy, uint256 timestamp)'
];

export default defineEventHandler(async (event) => {
  const { userId } = getAuth(event);
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const body = await readBody(event);
  const { messageId, decryptionKey } = body;

  if (!messageId) {
    throw createError({ statusCode: 400, message: "messageId is required" });
  }
  if (!decryptionKey) {
    throw createError({
      statusCode: 400,
      message: "decryptionKey is required",
    });
  }

  // validate required env vars
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw createError({
      statusCode: 500,
      message:
        "Server configuration error: SUPABASE_URL or SUPABASE_SERVICE_KEY missing",
    });
  }
  if (!MESSAGING_CONTRACT_ADDRESS || !SEPOLIA_RPC || !PRIVATE_KEY) {
    throw createError({
      statusCode: 500,
      message:
        "Server configuration error: MESSAGING_CONTRACT_ADDRESS, SEPOLIA_RPC_URL or DEPLOYER_PRIVATE_KEY missing",
    });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: { persistSession: false },
      }
    );

    // Fetch the message to verify existence and conversation
    const { data: messageRow, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("message_id", messageId)
      .single();

    if (msgError) throw msgError;
    if (!messageRow)
      throw createError({ statusCode: 404, message: "Message not found" });

    // Verify caller is participant in the conversation
    const conversationId = messageRow.conversation_id;
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("conversation_id", conversationId)
      .single();

    if (convError) throw convError;
    if (!conversation)
      throw createError({ statusCode: 404, message: "Conversation not found" });

    if (
      conversation.participant1_clerk_id !== userId &&
      conversation.participant2_clerk_id !== userId
    ) {
      throw createError({
        statusCode: 403,
        message: "Not authorized to unlock this message",
      });
    }

    // Connect to chain and call contract
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      MESSAGING_CONTRACT_ADDRESS,
      MESSAGING_ABI,
      signer
    );

    // Ensure messageId passed as number/BigInt if needed
    const msgIdArg =
      typeof messageId === "string" && /^\d+$/.test(messageId)
        ? BigInt(messageId)
        : messageId;

    const tx = await contract.unlockMessageForEvidence(msgIdArg, decryptionKey);
    const receipt = await tx.wait();

    // Update DB: mark as unlocked and store tx info
    const { data: updatedMsg, error: updateError } = await supabase
      .from("messages")
      .update({
        is_unlocked: true,
        unlocked_by: userId,
        unlocked_at: new Date().toISOString(),
        unlock_transaction_hash: receipt.hash,
        unlock_block_number: receipt.blockNumber,
      })
      .eq("message_id", messageId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      message: updatedMsg,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, message });
  }
});
