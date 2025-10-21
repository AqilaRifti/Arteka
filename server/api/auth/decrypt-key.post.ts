// server/api/auth/decrypt-key.post.ts
import { getAuth } from "@clerk/nuxt/server";
import CryptoJS from "crypto-js";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  try {
    const user = await getUserByClerkId(auth.userId);

    if (!user || !user.encrypted_private_key) {
      throw createError({
        statusCode: 404,
        message: "No wallet found for user",
      });
    }

    const config = useRuntimeConfig();
    const decryptedKey = CryptoJS.AES.decrypt(
      user.encrypted_private_key,
      config.private.encryptionKey || "default-key-change-in-production"
    ).toString(CryptoJS.enc.Utf8);

    return {
      privateKey: decryptedKey,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
