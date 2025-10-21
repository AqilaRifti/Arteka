// server/api/messages/send.post.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      message: "No data provided",
    });
  }

  const fields: any = {};
  let fileBuffer: Buffer | null = null;
  let fileName = "";
  let fileType = "";

  for (const part of formData) {
    if (part.name === "file" && part.data) {
      fileBuffer = part.data;
      fileName = part.filename || "unnamed";
      fileType = part.type || "application/octet-stream";
    } else if (part.data) {
      fields[part.name || ""] = part.data.toString("utf8");
    }
  }

  const { conversationId, content } = fields;

  if (!conversationId || !content) {
    throw createError({
      statusCode: 400,
      message: "Conversation ID and content are required",
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

    // Get conversation to verify participant
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
        message: "Not a participant in this conversation",
      });
    }

    // Generate one-time message key
    const messageKey = generateMessageKey();

    // Encrypt the message content
    const { encryptedContent, authTag } = encryptMessage(content, messageKey);

    // Upload file to IPFS if present
    let fileUrl = null;
    if (fileBuffer) {
      const { ipfsHash } = await uploadToIPFS(fileBuffer, fileName);
      fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    }

    // Create encrypted key for blockchain (using a simpler approach)
    const encryptedKey = Buffer.from(authTag, "hex").toString("base64");

    // Send message to blockchain
    const contract = getMessagingContract();
    const tx = await contract.sendMessage(
      conversation.blockchain_id,
      encryptedContent,
      encryptedKey
    );

    await tx.wait();

    // Get message counter
    const messageCounter = await contract.messageCounter();
    const blockchainId = Number(messageCounter);

    // Store in database
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        blockchain_id: blockchainId,
        conversation_id: conversationId,
        sender_id: user.id,
        encrypted_content: encryptedContent,
        encrypted_key: encryptedKey,
        message_key: messageKey, // Store for decryption
        file_url: fileUrl,
        file_name: fileName || null,
        file_type: fileType || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return {
      success: true,
      message: {
        ...message,
        decryptedContent: content, // Return decrypted for sender
      },
    };
  } catch (error: any) {
    console.error("Message send error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to send message",
    });
  }
});
