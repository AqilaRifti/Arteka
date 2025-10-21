// server/api/auth/wallet.post.ts
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

  const body = await readBody(event);
  const { walletAddress, privateKey } = body;

  if (!walletAddress || !privateKey) {
    throw createError({
      statusCode: 400,
      message: "Wallet address and private key are required",
    });
  }

  try {
    // Get user
    const user = await getUserByClerkId(auth.userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "User not found",
      });
    }

    // Encrypt private key before storing
    const config = useRuntimeConfig();
    const encryptedPrivateKey = CryptoJS.AES.encrypt(
      privateKey,
      config.private.encryptionKey || "default-key-change-in-production"
    ).toString();

    // Update user wallet
    const updatedUser = await updateUserWallet(
      user.id,
      walletAddress,
      encryptedPrivateKey
    );

    return {
      success: true,
      user: {
        ...updatedUser,
        encrypted_private_key: undefined, // Don't send encrypted key back
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
