// server/api/messaging/decrypt.post.ts
import CryptoJS from "crypto-js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { encryptedContent, encryptedKey, privateKey } = body;

  if (!encryptedContent || !encryptedKey) {
    throw createError({
      statusCode: 400,
      message: "Encrypted content and key are required",
    });
  }

  try {
    // Decrypt the symmetric key with user's private key
    const symmetricKey = CryptoJS.AES.decrypt(
      encryptedKey,
      privateKey || "default-key"
    ).toString(CryptoJS.enc.Utf8);

    // Decrypt the message with the symmetric key
    const decryptedMessage = CryptoJS.AES.decrypt(
      encryptedContent,
      symmetricKey
    ).toString(CryptoJS.enc.Utf8);

    return {
      message: decryptedMessage,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Failed to decrypt message",
    });
  }
});
