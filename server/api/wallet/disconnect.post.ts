// server/api/wallet/disconnect.post.ts
// Remove wallet (optional - for security)
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  try {
    const { userId } = getAuth(event);
    if (!userId) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Delete wallet
    const { error } = await supabase
      .from("user_wallets")
      .delete()
      .eq("clerk_user_id", userId);

    if (error) {
      throw createError({
        statusCode: 500,
        message: "Failed to disconnect wallet: " + error.message,
      });
    }

    return {
      success: true,
      message: "Wallet disconnected successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, message: error.message });
  }
});
