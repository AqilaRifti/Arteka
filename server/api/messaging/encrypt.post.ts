// server/api/messaging/encrypt.post.ts
import CryptoJS from "crypto-js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { message, recipientPublicKey } = body;

  if (!message) {
    throw createError({
      statusCode: 400,
      message: "Message is required",
    });
  }

  try {
    // Generate a random symmetric key
    const symmetricKey = CryptoJS.lib.WordArray.random(32).toString();

    // Encrypt the message with the symmetric key
    const encryptedContent = CryptoJS.AES.encrypt(
      message,
      symmetricKey
    ).toString();

    // In production, encrypt the symmetric key with recipient's public key
    // For now, we'll use a simple placeholder
    const encryptedKey = CryptoJS.AES.encrypt(
      symmetricKey,
      recipientPublicKey || "default-key"
    ).toString();

    return {
      encryptedContent,
      encryptedKey,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
